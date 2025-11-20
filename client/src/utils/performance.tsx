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

interface WebVitalsMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface ResourceMetrics {
  name: string;
  type: string;
  duration: number;
  size: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: {
    components: PerformanceMetrics[];
    apis: ApiMetrics[];
    interactions: UserInteractionMetrics[];
    webVitals: WebVitalsMetrics[];
    resources: ResourceMetrics[];
  } = {
    components: [],
    apis: [],
    interactions: [],
    webVitals: [],
    resources: [],
  };

  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
    this.setupNavigationTiming();
    this.setupWebVitals();
    this.setupResourceTiming();
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

  private setupWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          const lcpValue = lastEntry.renderTime || lastEntry.loadTime;
          
          this.metrics.webVitals.push({
            name: 'LCP',
            value: lcpValue,
            rating: lcpValue <= 2500 ? 'good' : lcpValue <= 4000 ? 'needs-improvement' : 'poor',
            timestamp: Date.now(),
          });
          
          console.log(`LCP: ${lcpValue.toFixed(2)}ms`);
        });
        
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            const fidValue = entry.processingStart - entry.startTime;
            
            this.metrics.webVitals.push({
              name: 'FID',
              value: fidValue,
              rating: fidValue <= 100 ? 'good' : fidValue <= 300 ? 'needs-improvement' : 'poor',
              timestamp: Date.now(),
            });
            
            console.log(`FID: ${fidValue.toFixed(2)}ms`);
          });
        });
        
        fidObserver.observe({ type: 'first-input', buffered: true });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          
          this.metrics.webVitals.push({
            name: 'CLS',
            value: clsValue,
            rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
            timestamp: Date.now(),
          });
        });
        
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }

      // Interaction to Next Paint (INP)
      try {
        const inpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            const inpValue = entry.duration;
            
            this.metrics.webVitals.push({
              name: 'INP',
              value: inpValue,
              rating: inpValue <= 200 ? 'good' : inpValue <= 500 ? 'needs-improvement' : 'poor',
              timestamp: Date.now(),
            });
          });
        });
        
        inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 } as any);
        this.observers.push(inpObserver);
      } catch (error) {
        console.warn('INP observer not supported:', error);
      }
    }

    // Time to First Byte (TTFB)
    window.addEventListener('load', () => {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navTiming) {
        const ttfb = navTiming.responseStart - navTiming.requestStart;
        
        this.metrics.webVitals.push({
          name: 'TTFB',
          value: ttfb,
          rating: ttfb <= 800 ? 'good' : ttfb <= 1800 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
        });
        
        console.log(`TTFB: ${ttfb.toFixed(2)}ms`);
      }
    });
  }

  private setupResourceTiming() {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Skip data URLs and very small resources
            if (resourceEntry.name.startsWith('data:') || resourceEntry.duration < 1) {
              continue;
            }
            
            this.metrics.resources.push({
              name: resourceEntry.name,
              type: resourceEntry.initiatorType,
              duration: resourceEntry.duration,
              size: resourceEntry.transferSize || 0,
              timestamp: Date.now(),
            });
            
            // Log slow resources
            if (resourceEntry.duration > 1000) {
              console.warn(`Slow resource: ${resourceEntry.name} took ${resourceEntry.duration.toFixed(2)}ms`);
            }
          }
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }
    }
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

    // Get latest Web Vitals
    const latestWebVitals: { [key: string]: WebVitalsMetrics } = {};
    this.metrics.webVitals.forEach(metric => {
      if (!latestWebVitals[metric.name] || metric.timestamp > latestWebVitals[metric.name].timestamp) {
        latestWebVitals[metric.name] = metric;
      }
    });

    // Calculate total resource size and average load time
    const totalResourceSize = this.metrics.resources.reduce((sum, r) => sum + r.size, 0);
    const avgResourceLoadTime = this.metrics.resources.length > 0
      ? this.metrics.resources.reduce((sum, r) => sum + r.duration, 0) / this.metrics.resources.length
      : 0;

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
      webVitals: latestWebVitals,
      totalResourcesLoaded: this.metrics.resources.length,
      totalResourceSize: totalResourceSize,
      averageResourceLoadTime: avgResourceLoadTime,
    };
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = {
      components: [],
      apis: [],
      interactions: [],
      webVitals: [],
      resources: [],
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

  // Get Web Vitals metrics
  getWebVitals() {
    const vitals: { [key: string]: WebVitalsMetrics } = {};
    this.metrics.webVitals.forEach(metric => {
      if (!vitals[metric.name] || metric.timestamp > vitals[metric.name].timestamp) {
        vitals[metric.name] = metric;
      }
    });
    return vitals;
  }

  // Get resource metrics by type
  getResourceMetricsByType() {
    const byType: { [key: string]: ResourceMetrics[] } = {};
    this.metrics.resources.forEach(resource => {
      if (!byType[resource.type]) {
        byType[resource.type] = [];
      }
      byType[resource.type].push(resource);
    });
    return byType;
  }

  // Get slow resources
  getSlowResources(threshold = 1000) {
    return this.metrics.resources.filter(r => r.duration > threshold);
  }

  // Get bundle analysis
  getBundleAnalysis() {
    const scripts = this.metrics.resources.filter(r => r.type === 'script');
    const styles = this.metrics.resources.filter(r => r.type === 'css' || r.type === 'link');
    
    const totalScriptSize = scripts.reduce((sum, s) => sum + s.size, 0);
    const totalStyleSize = styles.reduce((sum, s) => sum + s.size, 0);
    
    return {
      scripts: {
        count: scripts.length,
        totalSize: totalScriptSize,
        averageLoadTime: scripts.length > 0 
          ? scripts.reduce((sum, s) => sum + s.duration, 0) / scripts.length 
          : 0,
      },
      styles: {
        count: styles.length,
        totalSize: totalStyleSize,
        averageLoadTime: styles.length > 0 
          ? styles.reduce((sum, s) => sum + s.duration, 0) / styles.length 
          : 0,
      },
      totalSize: totalScriptSize + totalStyleSize,
    };
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
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