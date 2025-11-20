import React from 'react';

interface PerformanceMetrics {
  componentRenderTime: number;
  componentName: string;
  timestamp: number;
}

interface ApiMetrics {
  endpoint: string;
  duration: number;
  status: number;
  timestamp: number;
  success: boolean;
}

interface UserInteractionMetrics {
  action: string;
  element: string;
  duration?: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: {
    components: PerformanceMetrics[];
    apis: ApiMetrics[];
    interactions: UserInteractionMetrics[];
  } = {
    components: [],
    apis: [],
    interactions: [],
  };

  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
    this.setupNavigationTiming();
  }

  private initializeObservers() {
    // Observe long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              console.warn('Long task detected:', {
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
              });
            }
          }
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('PerformanceObserver for longtask not supported:', error);
      }

      // Observe navigation
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.logNavigationMetrics(navEntry);
            }
          }
        });
        
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        console.warn('PerformanceObserver for navigation not supported:', error);
      }
    }
  }

  private setupNavigationTiming() {
    // Log page load metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.logNavigationMetrics(navigation);
        }
      }, 0);
    });
  }

  private logNavigationMetrics(navigation: PerformanceNavigationTiming) {
    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: 0,
      firstContentfulPaint: 0,
      totalTime: navigation.loadEventEnd - navigation.fetchStart,
    };

    // Get paint metrics
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach((entry) => {
      if (entry.name === 'first-paint') {
        metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });

    console.log('Navigation Performance Metrics:', metrics);
    
    // Store metrics for analysis
    this.metrics.interactions.push({
      action: 'page_load',
      element: window.location.pathname,
      duration: metrics.totalTime,
      timestamp: Date.now(),
    });
  }

  // Component performance monitoring
  measureComponentRender(componentName: string) {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      const metric: PerformanceMetrics = {
        componentName,
        componentRenderTime: renderTime,
        timestamp: Date.now(),
      };

      this.metrics.components.push(metric);

      // Log slow renders
      if (renderTime > 16) { // More than one frame at 60fps
        console.warn(`Slow component render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    };
  }

  // API performance monitoring
  async measureApiCall<T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;

      const metric: ApiMetrics = {
        endpoint,
        duration,
        status: 200,
        timestamp: Date.now(),
        success: true,
      };

      this.metrics.apis.push(metric);

      // Log slow API calls
      if (duration > 1000) {
        console.warn(`Slow API call: ${endpoint} took ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error: any) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const metric: ApiMetrics = {
        endpoint,
        duration,
        status: error.response?.status || 0,
        timestamp: Date.now(),
        success: false,
      };

      this.metrics.apis.push(metric);
      throw error;
    }
  }

  // User interaction monitoring
  trackInteraction(action: string, element: string, duration?: number) {
    const metric: UserInteractionMetrics = {
      action,
      element,
      duration,
      timestamp: Date.now(),
    };

    this.metrics.interactions.push(metric);
  }

  // Get performance summary
  getPerformanceSummary() {
    const componentAvg = this.metrics.components.length > 0
      ? this.metrics.components.reduce((sum, m) => sum + m.componentRenderTime, 0) / this.metrics.components.length
      : 0;

    const apiAvg = this.metrics.apis.length > 0
      ? this.metrics.apis.reduce((sum, m) => sum + m.duration, 0) / this.metrics.apis.length
      : 0;

    const slowComponents = this.metrics.components.filter(m => m.componentRenderTime > 16);
    const slowApis = this.metrics.apis.filter(m => m.duration > 1000);

    return {
      totalComponentRenders: this.metrics.components.length,
      averageComponentRenderTime: componentAvg,
      slowComponentsCount: slowComponents.length,
      totalApiCalls: this.metrics.apis.length,
      averageApiCallTime: apiAvg,
      slowApiCallsCount: slowApis.length,
      totalInteractions: this.metrics.interactions.length,
      apiSuccessRate: this.metrics.apis.length > 0
        ? (this.metrics.apis.filter(m => m.success).length / this.metrics.apis.length) * 100
        : 100,
    };
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = {
      components: [],
      apis: [],
      interactions: [],
    };
  }

  // Export metrics for analysis
  exportMetrics() {
    return {
      ...this.metrics,
      summary: this.getPerformanceSummary(),
      exportedAt: Date.now(),
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const startRender = () => {
    return performanceMonitor.measureComponentRender(componentName);
  };

  return {
    startRender,
    trackInteraction: performanceMonitor.trackInteraction.bind(performanceMonitor),
  };
};

// Higher-order component for performance monitoring
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const WrappedComponent = (props: P) => {
    const displayName = componentName || Component.displayName || Component.name || 'Component';
    const endMeasure = performanceMonitor.measureComponentRender(displayName);

    React.useEffect(() => {
      endMeasure();
    });

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName || Component.displayName || Component.name})`;
  
  return WrappedComponent;
};