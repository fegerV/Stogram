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

interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

interface BundleMetrics {
  name: string;
  size: number;
  loadTime: number;
  timestamp: number;
}

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: {
    components: PerformanceMetrics[];
    apis: ApiMetrics[];
    interactions: UserInteractionMetrics[];
    coreWebVitals: CoreWebVitals[];
    bundles: BundleMetrics[];
    memory: MemoryMetrics[];
  } = {
    components: [],
    apis: [],
    interactions: [],
    coreWebVitals: [],
    bundles: [],
    memory: [],
  };

  private observers: PerformanceObserver[] = [];
  private performanceBudgets = {
    componentRender: 16, // ms
    apiCall: 1000, // ms
    lcp: 2500, // ms
    fid: 100, // ms
    cls: 0.1,
    bundleSize: 250 * 1024, // 250KB
  };

  constructor() {
    this.initializeObservers();
    this.setupNavigationTiming();
    this.setupCoreWebVitals();
    this.setupMemoryMonitoring();
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

  private setupCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            this.recordWebVital('lcp', lastEntry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'first-input') {
              const fidEntry = entry as any;
              this.recordWebVital('fid', fidEntry.processingStart - fidEntry.startTime);
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.recordWebVital('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }
    }

    // First Contentful Paint (FCP) and Time to First Byte (TTFB)
    this.measurePaintMetrics();
  }

  private measurePaintMetrics() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      const navigationEntries = performance.getEntriesByType('navigation');

      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.recordWebVital('fcp', entry.startTime);
        }
      });

      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        this.recordWebVital('ttfb', navEntry.responseStart - navEntry.requestStart);
      }
    }
  }

  private recordWebVital(name: keyof CoreWebVitals, value: number) {
    const vital: CoreWebVitals = {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
      [name]: value,
    };

    this.metrics.coreWebVitals.push(vital);

    // Check against budgets and log warnings
    const budget = this.performanceBudgets[name as keyof typeof this.performanceBudgets];
    if (budget && value > budget) {
      console.warn(`Performance budget exceeded for ${name}: ${value.toFixed(2)} > ${budget}`);
      this.triggerPerformanceAlert(name, value, budget);
    }
  }

  private setupMemoryMonitoring() {
    if ('memory' in performance) {
      const recordMemory = () => {
        const memory = (performance as any).memory;
        const metric: MemoryMetrics = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          timestamp: Date.now(),
        };
        this.metrics.memory.push(metric);

        // Alert if memory usage is high (> 80% of limit)
        const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        if (usageRatio > 0.8) {
          console.warn(`High memory usage: ${(usageRatio * 100).toFixed(1)}%`);
          this.triggerPerformanceAlert('memory', usageRatio, 0.8);
        }
      };

      // Record memory every 10 seconds
      setInterval(recordMemory, 10000);
      recordMemory(); // Initial recording
    }
  }

  private triggerPerformanceAlert(metric: string, value: number, budget: number) {
    const alert = {
      metric,
      value,
      budget,
      timestamp: Date.now(),
      url: window.location.pathname,
    };

    // Store alert for dashboard
    this.metrics.interactions.push({
      action: 'performance_alert',
      element: `${metric}_alert`,
      duration: value,
      timestamp: alert.timestamp,
    });

    // Dispatch custom event for real-time monitoring
    window.dispatchEvent(new CustomEvent('performanceAlert', { detail: alert }));
  }

  // Bundle size monitoring
  trackBundleLoad(bundleName: string, size: number, loadTime: number) {
    const metric: BundleMetrics = {
      name: bundleName,
      size,
      loadTime,
      timestamp: Date.now(),
    };
    this.metrics.bundles.push(metric);

    if (size > this.performanceBudgets.bundleSize) {
      console.warn(`Bundle size exceeded: ${bundleName} ${(size / 1024).toFixed(1)}KB`);
      this.triggerPerformanceAlert('bundleSize', size, this.performanceBudgets.bundleSize);
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

    // Core Web Vitals averages
    const lcpAvg = this.metrics.coreWebVitals.filter(v => v.lcp > 0).reduce((sum, v) => sum + v.lcp, 0) / this.metrics.coreWebVitals.filter(v => v.lcp > 0).length || 0;
    const fidAvg = this.metrics.coreWebVitals.filter(v => v.fid > 0).reduce((sum, v) => sum + v.fid, 0) / this.metrics.coreWebVitals.filter(v => v.fid > 0).length || 0;
    const clsAvg = this.metrics.coreWebVitals.filter(v => v.cls > 0).reduce((sum, v) => sum + v.cls, 0) / this.metrics.coreWebVitals.filter(v => v.cls > 0).length || 0;
    const fcpAvg = this.metrics.coreWebVitals.filter(v => v.fcp > 0).reduce((sum, v) => sum + v.fcp, 0) / this.metrics.coreWebVitals.filter(v => v.fcp > 0).length || 0;
    const ttfbAvg = this.metrics.coreWebVitals.filter(v => v.ttfb > 0).reduce((sum, v) => sum + v.ttfb, 0) / this.metrics.coreWebVitals.filter(v => v.ttfb > 0).length || 0;

    // Bundle metrics
    const totalBundleSize = this.metrics.bundles.reduce((sum, b) => sum + b.size, 0);
    const avgBundleLoadTime = this.metrics.bundles.length > 0
      ? this.metrics.bundles.reduce((sum, b) => sum + b.loadTime, 0) / this.metrics.bundles.length
      : 0;

    // Memory metrics
    const currentMemory = this.metrics.memory[this.metrics.memory.length - 1];
    const memoryUsageRatio = currentMemory ? currentMemory.usedJSHeapSize / currentMemory.jsHeapSizeLimit : 0;

    // Performance alerts
    const performanceAlerts = this.metrics.interactions.filter(i => i.action === 'performance_alert');

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
      // Core Web Vitals
      coreWebVitals: {
        lcp: lcpAvg,
        fid: fidAvg,
        cls: clsAvg,
        fcp: fcpAvg,
        ttfb: ttfbAvg,
      },
      // Bundle metrics
      bundles: {
        totalSize: totalBundleSize,
        averageLoadTime: avgBundleLoadTime,
        count: this.metrics.bundles.length,
      },
      // Memory metrics
      memory: {
        usageRatio: memoryUsageRatio,
        usedHeapMB: currentMemory ? currentMemory.usedJSHeapSize / (1024 * 1024) : 0,
        totalHeapMB: currentMemory ? currentMemory.totalJSHeapSize / (1024 * 1024) : 0,
      },
      // Performance alerts
      performanceAlertsCount: performanceAlerts.length,
    };
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = {
      components: [],
      apis: [],
      interactions: [],
      coreWebVitals: [],
      bundles: [],
      memory: [],
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