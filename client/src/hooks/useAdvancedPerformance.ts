import { useState, useEffect, useCallback, useRef } from 'react';
import { performanceMonitor } from '../utils/performance';

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  inp?: number; // Interaction to Next Paint

  // Component Metrics
  componentRenderTime: number;
  componentRenderCount: number;
  slowRendersCount: number;

  // API Metrics
  apiCallCount: number;
  apiAverageTime: number;
  apiSuccessRate: number;

  // Resource Metrics
  resourceCount: number;
  totalResourceSize: number;
  averageResourceLoadTime: number;

  // Memory Metrics
  memoryUsage?: number;
  memoryLimit?: number;
  memoryPercentage?: number;

  // Real-time Metrics
  fps: number;
  
  // Performance Budget Status
  budgetStatus: {
    renderTime: 'good' | 'warning' | 'critical';
    apiTime: 'good' | 'warning' | 'critical';
    lcp: 'good' | 'needs-improvement' | 'poor' | 'unknown';
    fid: 'good' | 'needs-improvement' | 'poor' | 'unknown';
    cls: 'good' | 'needs-improvement' | 'poor' | 'unknown';
    bundleSize: 'good' | 'warning' | 'critical';
    memory: 'good' | 'warning' | 'critical';
  };
}

export interface PerformanceBudget {
  maxRenderTime: number; // ms
  maxApiTime: number; // ms
  maxLCP: number; // ms
  maxFID: number; // ms
  maxCLS: number;
  maxBundleSize: number; // bytes
  maxMemoryUsage: number; // percentage
}

export interface PerformanceAlert {
  type: 'render' | 'api' | 'webvital' | 'bundle' | 'memory';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

const DEFAULT_BUDGET: PerformanceBudget = {
  maxRenderTime: 16, // 60fps = 16ms per frame
  maxApiTime: 1000, // 1 second
  maxLCP: 2500, // 2.5 seconds (Google's "good" threshold)
  maxFID: 100, // 100ms (Google's "good" threshold)
  maxCLS: 0.1, // 0.1 (Google's "good" threshold)
  maxBundleSize: 250 * 1024, // 250KB per chunk
  maxMemoryUsage: 80, // 80% of available heap
};

export const useAdvancedPerformance = (
  componentName: string,
  budget: Partial<PerformanceBudget> = {}
) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const performanceBudget = { ...DEFAULT_BUDGET, ...budget };
  const fpsRef = useRef(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // Measure component render time
  const measureRender = useCallback(() => {
    const endMeasure = performanceMonitor.measureComponentRender(componentName);
    return endMeasure;
  }, [componentName]);

  // Track user interaction
  const trackInteraction = useCallback(
    (action: string, duration?: number) => {
      performanceMonitor.trackInteraction(action, componentName, duration);
    },
    [componentName]
  );

  // Track API call
  const trackApiCall = useCallback(
    async <T,>(endpoint: string, apiCall: () => Promise<T>): Promise<T> => {
      return performanceMonitor.measureApiCall(endpoint, apiCall);
    },
    []
  );

  // Check performance budgets and generate alerts
  const checkBudgets = useCallback(
    (currentMetrics: PerformanceMetrics) => {
      const newAlerts: PerformanceAlert[] = [];

      // Check render time
      if (currentMetrics.componentRenderTime > performanceBudget.maxRenderTime) {
        newAlerts.push({
          type: 'render',
          severity:
            currentMetrics.componentRenderTime > performanceBudget.maxRenderTime * 2
              ? 'critical'
              : 'warning',
          message: `Component render time exceeded budget`,
          value: currentMetrics.componentRenderTime,
          threshold: performanceBudget.maxRenderTime,
          timestamp: Date.now(),
        });
      }

      // Check API time
      if (currentMetrics.apiAverageTime > performanceBudget.maxApiTime) {
        newAlerts.push({
          type: 'api',
          severity:
            currentMetrics.apiAverageTime > performanceBudget.maxApiTime * 1.5
              ? 'critical'
              : 'warning',
          message: `API average time exceeded budget`,
          value: currentMetrics.apiAverageTime,
          threshold: performanceBudget.maxApiTime,
          timestamp: Date.now(),
        });
      }

      // Check LCP
      if (currentMetrics.lcp && currentMetrics.lcp > performanceBudget.maxLCP) {
        newAlerts.push({
          type: 'webvital',
          severity: currentMetrics.lcp > 4000 ? 'critical' : 'warning',
          message: `Largest Contentful Paint exceeded budget`,
          value: currentMetrics.lcp,
          threshold: performanceBudget.maxLCP,
          timestamp: Date.now(),
        });
      }

      // Check FID
      if (currentMetrics.fid && currentMetrics.fid > performanceBudget.maxFID) {
        newAlerts.push({
          type: 'webvital',
          severity: currentMetrics.fid > 300 ? 'critical' : 'warning',
          message: `First Input Delay exceeded budget`,
          value: currentMetrics.fid,
          threshold: performanceBudget.maxFID,
          timestamp: Date.now(),
        });
      }

      // Check CLS
      if (currentMetrics.cls && currentMetrics.cls > performanceBudget.maxCLS) {
        newAlerts.push({
          type: 'webvital',
          severity: currentMetrics.cls > 0.25 ? 'critical' : 'warning',
          message: `Cumulative Layout Shift exceeded budget`,
          value: currentMetrics.cls,
          threshold: performanceBudget.maxCLS,
          timestamp: Date.now(),
        });
      }

      // Check memory usage
      if (
        currentMetrics.memoryPercentage &&
        currentMetrics.memoryPercentage > performanceBudget.maxMemoryUsage
      ) {
        newAlerts.push({
          type: 'memory',
          severity:
            currentMetrics.memoryPercentage > performanceBudget.maxMemoryUsage * 1.1
              ? 'critical'
              : 'warning',
          message: `Memory usage exceeded budget`,
          value: currentMetrics.memoryPercentage,
          threshold: performanceBudget.maxMemoryUsage,
          timestamp: Date.now(),
        });
      }

      return newAlerts;
    },
    [performanceBudget]
  );

  // Calculate budget status
  const calculateBudgetStatus = useCallback(
    (currentMetrics: PerformanceMetrics) => {
      const status = {
        renderTime:
          currentMetrics.componentRenderTime > performanceBudget.maxRenderTime * 2
            ? ('critical' as const)
            : currentMetrics.componentRenderTime > performanceBudget.maxRenderTime
            ? ('warning' as const)
            : ('good' as const),
        
        apiTime:
          currentMetrics.apiAverageTime > performanceBudget.maxApiTime * 1.5
            ? ('critical' as const)
            : currentMetrics.apiAverageTime > performanceBudget.maxApiTime
            ? ('warning' as const)
            : ('good' as const),
        
        lcp: !currentMetrics.lcp
          ? ('unknown' as const)
          : currentMetrics.lcp <= performanceBudget.maxLCP
          ? ('good' as const)
          : currentMetrics.lcp <= 4000
          ? ('needs-improvement' as const)
          : ('poor' as const),
        
        fid: !currentMetrics.fid
          ? ('unknown' as const)
          : currentMetrics.fid <= performanceBudget.maxFID
          ? ('good' as const)
          : currentMetrics.fid <= 300
          ? ('needs-improvement' as const)
          : ('poor' as const),
        
        cls: !currentMetrics.cls
          ? ('unknown' as const)
          : currentMetrics.cls <= performanceBudget.maxCLS
          ? ('good' as const)
          : currentMetrics.cls <= 0.25
          ? ('needs-improvement' as const)
          : ('poor' as const),
        
        bundleSize:
          currentMetrics.totalResourceSize > performanceBudget.maxBundleSize * 1.5
            ? ('critical' as const)
            : currentMetrics.totalResourceSize > performanceBudget.maxBundleSize
            ? ('warning' as const)
            : ('good' as const),
        
        memory: !currentMetrics.memoryPercentage
          ? ('good' as const)
          : currentMetrics.memoryPercentage > performanceBudget.maxMemoryUsage * 1.1
          ? ('critical' as const)
          : currentMetrics.memoryPercentage > performanceBudget.maxMemoryUsage
          ? ('warning' as const)
          : ('good' as const),
      };
      
      return status;
    },
    [performanceBudget]
  );

  // Update metrics
  const updateMetrics = useCallback(() => {
    if (!isMonitoring) return;

    const summary = performanceMonitor.getPerformanceSummary();
    const webVitals = performanceMonitor.getWebVitals();

    // Get memory info
    let memoryUsage: number | undefined;
    let memoryLimit: number | undefined;
    let memoryPercentage: number | undefined;

    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize;
      memoryLimit = memory.jsHeapSizeLimit;
      if (typeof memoryUsage === 'number' && typeof memoryLimit === 'number' && memoryLimit > 0) {
        memoryPercentage = (memoryUsage / memoryLimit) * 100;
      }
    }

    const currentMetrics: PerformanceMetrics = {
      lcp: webVitals.LCP?.value,
      fid: webVitals.FID?.value,
      cls: webVitals.CLS?.value,
      fcp: webVitals.FCP?.value,
      ttfb: webVitals.TTFB?.value,
      inp: webVitals.INP?.value,
      componentRenderTime: summary.averageComponentRenderTime || 0,
      componentRenderCount: summary.totalComponentRenders || 0,
      slowRendersCount: summary.slowComponentsCount || 0,
      apiCallCount: summary.totalApiCalls || 0,
      apiAverageTime: summary.averageApiCallTime || 0,
      apiSuccessRate: summary.apiSuccessRate || 100,
      resourceCount: summary.totalResourcesLoaded || 0,
      totalResourceSize: summary.totalResourceSize || 0,
      averageResourceLoadTime: summary.averageResourceLoadTime || 0,
      memoryUsage,
      memoryLimit,
      memoryPercentage,
      fps: fpsRef.current,
      budgetStatus: calculateBudgetStatus({
        lcp: webVitals.LCP?.value,
        fid: webVitals.FID?.value,
        cls: webVitals.CLS?.value,
        componentRenderTime: summary.averageComponentRenderTime || 0,
        componentRenderCount: summary.totalComponentRenders || 0,
        slowRendersCount: summary.slowComponentsCount || 0,
        apiCallCount: summary.totalApiCalls || 0,
        apiAverageTime: summary.averageApiCallTime || 0,
        apiSuccessRate: summary.apiSuccessRate || 100,
        resourceCount: summary.totalResourcesLoaded || 0,
        totalResourceSize: summary.totalResourceSize || 0,
        averageResourceLoadTime: summary.averageResourceLoadTime || 0,
        memoryUsage,
        memoryLimit,
        memoryPercentage,
        fps: fpsRef.current,
        budgetStatus: {
          renderTime: 'good',
          apiTime: 'good',
          lcp: 'unknown',
          fid: 'unknown',
          cls: 'unknown',
          bundleSize: 'good',
          memory: 'good',
        },
      }),
    };

    setMetrics(currentMetrics);

    // Check budgets and generate alerts
    const newAlerts = checkBudgets(currentMetrics);
    if (newAlerts.length > 0) {
      setAlerts((prev) => [...prev, ...newAlerts].slice(-20)); // Keep last 20 alerts
    }
  }, [isMonitoring, checkBudgets, calculateBudgetStatus]);

  // FPS monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const measureFps = () => {
      frameCountRef.current++;
      const currentTime = performance.now();

      if (currentTime - lastTimeRef.current >= 1000) {
        fpsRef.current = Math.round(
          (frameCountRef.current * 1000) / (currentTime - lastTimeRef.current)
        );
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      requestAnimationFrame(measureFps);
    };

    const animationId = requestAnimationFrame(measureFps);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isMonitoring]);

  // Periodic metrics update
  useEffect(() => {
    if (!isMonitoring) return;

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring, updateMetrics]);

  // Clear old alerts periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts((prev) =>
        prev.filter((alert) => Date.now() - alert.timestamp < 60000) // Keep alerts for 1 minute
      );
    }, 10000); // Clean every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const pauseMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const resumeMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const exportMetrics = useCallback(() => {
    const data = {
      componentName,
      metrics,
      alerts,
      budget: performanceBudget,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-${componentName}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [componentName, metrics, alerts, performanceBudget]);

  return {
    metrics,
    alerts,
    isMonitoring,
    measureRender,
    trackInteraction,
    trackApiCall,
    clearAlerts,
    pauseMonitoring,
    resumeMonitoring,
    exportMetrics,
    performanceBudget,
  };
};
