import { useEffect, useRef, useState, useCallback } from 'react';
import { performanceMonitor } from '../utils/performance';
import { bundleAnalyzer } from '../utils/bundleAnalyzer';

interface UseAdvancedPerformanceOptions {
  trackComponentRenders?: boolean;
  trackInteractions?: boolean;
  trackMemory?: boolean;
  trackWebVitals?: boolean;
  enableAlerts?: boolean;
  alertThresholds?: {
    componentRenderTime?: number;
    memoryUsage?: number;
    interactionDelay?: number;
  };
}

interface PerformanceAlert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

interface PerformanceData {
  componentRenders: number;
  averageRenderTime: number;
  memoryUsage: number;
  interactionCount: number;
  webVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
  bundleSize: number;
  alerts: PerformanceAlert[];
}

export const useAdvancedPerformance = (
  componentName: string,
  options: UseAdvancedPerformanceOptions = {}
) => {
  const {
    trackComponentRenders = true,
    trackInteractions = true,
    enableAlerts = true,
    alertThresholds = {
      componentRenderTime: 16,
      memoryUsage: 0.8,
      interactionDelay: 100,
    },
  } = options;

  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    componentRenders: 0,
    averageRenderTime: 0,
    memoryUsage: 0,
    interactionCount: 0,
    webVitals: {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
    },
    bundleSize: 0,
    alerts: [],
  });

  const [isTracking, setIsTracking] = useState(false);
  const renderStartTime = useRef<number>(0);
  const interactionStartTime = useRef<number>(0);
  const alertHistory = useRef<PerformanceAlert[]>([]);

  // Start performance tracking
  const startTracking = useCallback(() => {
    setIsTracking(true);
    
    if (trackComponentRenders) {
      renderStartTime.current = performance.now();
    }

    // Set up performance alert listener
    if (enableAlerts) {
      const handlePerformanceAlert = (event: CustomEvent) => {
        const alert: PerformanceAlert = {
          id: Math.random().toString(36).substr(2, 9),
          metric: event.detail.metric,
          value: event.detail.value,
          threshold: event.detail.budget,
          timestamp: event.detail.timestamp,
          severity: getSeverity(event.detail.metric, event.detail.value, event.detail.budget),
          message: generateAlertMessage(event.detail.metric, event.detail.value, event.detail.budget),
        };

        alertHistory.current.push(alert);
        
        // Keep only last 20 alerts
        if (alertHistory.current.length > 20) {
          alertHistory.current = alertHistory.current.slice(-20);
        }

        setPerformanceData(prev => ({
          ...prev,
          alerts: [...alertHistory.current],
        }));
      };

      window.addEventListener('performanceAlert', handlePerformanceAlert as EventListener);
      
      return () => {
        window.removeEventListener('performanceAlert', handlePerformanceAlert as EventListener);
      };
    }
  }, [trackComponentRenders, enableAlerts]);

  // Stop performance tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    
    if (trackComponentRenders && renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      performanceMonitor.measureComponentRender(componentName)();
      
      // Check for performance alert
      if (enableAlerts && renderTime > alertThresholds.componentRenderTime!) {
        const alert: PerformanceAlert = {
          id: Math.random().toString(36).substr(2, 9),
          metric: 'componentRenderTime',
          value: renderTime,
          threshold: alertThresholds.componentRenderTime!,
          timestamp: Date.now(),
          severity: getSeverity('componentRenderTime', renderTime, alertThresholds.componentRenderTime!),
          message: `${componentName} render time: ${renderTime.toFixed(2)}ms (threshold: ${alertThresholds.componentRenderTime}ms)`,
        };

        alertHistory.current.push(alert);
      }
    }
  }, [trackComponentRenders, componentName, enableAlerts, alertThresholds]);

  // Track user interaction
  const trackInteraction = useCallback((action: string, element?: string) => {
    if (!trackInteractions) return;

    const duration = interactionStartTime.current > 0 
      ? performance.now() - interactionStartTime.current 
      : undefined;

    performanceMonitor.trackInteraction(action, element || componentName, duration);

    setPerformanceData(prev => ({
      ...prev,
      interactionCount: prev.interactionCount + 1,
    }));

    // Check for interaction delay alert
    if (enableAlerts && duration && duration > alertThresholds.interactionDelay!) {
      const alert: PerformanceAlert = {
        id: Math.random().toString(36).substr(2, 9),
        metric: 'interactionDelay',
        value: duration,
        threshold: alertThresholds.interactionDelay!,
        timestamp: Date.now(),
        severity: getSeverity('interactionDelay', duration, alertThresholds.interactionDelay!),
        message: `Interaction delay: ${duration.toFixed(2)}ms (threshold: ${alertThresholds.interactionDelay}ms)`,
      };

      alertHistory.current.push(alert);
    }
  }, [trackInteractions, componentName, enableAlerts, alertThresholds]);

  // Start interaction timer
  const startInteractionTimer = useCallback(() => {
    interactionStartTime.current = performance.now();
  }, []);

  // Update performance data
  const updatePerformanceData = useCallback(() => {
    const summary = performanceMonitor.getPerformanceSummary();
    const bundleAnalysis = bundleAnalyzer.analyzeBundles();

    setPerformanceData(prev => ({
      ...prev,
      componentRenders: summary.totalComponentRenders,
      averageRenderTime: summary.averageComponentRenderTime,
      memoryUsage: summary.memory.usageRatio,
      webVitals: summary.coreWebVitals,
      bundleSize: bundleAnalysis.totalSize,
      alerts: [...alertHistory.current],
    }));
  }, []);

  // Get performance recommendations
  const getRecommendations = useCallback(() => {
    const summary = performanceMonitor.getPerformanceSummary();
    const bundleAnalysis = bundleAnalyzer.analyzeBundles();
    const recommendations: string[] = [];

    // Component recommendations
    if (summary.slowComponentsCount > 0) {
      recommendations.push(`Optimize ${summary.slowComponentsCount} slow component(s) with render times > 16ms`);
    }

    // Memory recommendations
    if (summary.memory.usageRatio > 0.8) {
      recommendations.push('High memory usage detected. Consider memory optimization techniques');
    }

    // Bundle recommendations
    recommendations.push(...bundleAnalysis.recommendations);

    // Web Vitals recommendations
    if (summary.coreWebVitals.lcp > 2500) {
      recommendations.push('Improve Largest Contentful Paint by optimizing loading performance');
    }
    if (summary.coreWebVitals.fid > 100) {
      recommendations.push('Reduce First Input Delay by optimizing JavaScript execution');
    }
    if (summary.coreWebVitals.cls > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift by ensuring proper element dimensions');
    }

    return recommendations;
  }, []);

  // Export performance data
  const exportData = useCallback(() => {
    const data = {
      component: componentName,
      timestamp: new Date().toISOString(),
      performanceData,
      summary: performanceMonitor.getPerformanceSummary(),
      bundleAnalysis: bundleAnalyzer.analyzeBundles(),
      recommendations: getRecommendations(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${componentName}-performance-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [componentName, performanceData, getRecommendations]);

  // Clear performance data
  const clearData = useCallback(() => {
    alertHistory.current = [];
    performanceMonitor.clearMetrics();
    bundleAnalyzer.clearCache();
    setPerformanceData({
      componentRenders: 0,
      averageRenderTime: 0,
      memoryUsage: 0,
      interactionCount: 0,
      webVitals: {
        lcp: 0,
        fid: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0,
      },
      bundleSize: 0,
      alerts: [],
    });
  }, []);

  // Set up automatic data updates
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(updatePerformanceData, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isTracking, updatePerformanceData]);

  // Helper functions
  const getSeverity = (_metric: string, value: number, threshold: number): 'low' | 'medium' | 'high' => {
    const ratio = value / threshold;
    if (ratio <= 1) return 'low';
    if (ratio <= 1.5) return 'medium';
    return 'high';
  };

  const generateAlertMessage = (metric: string, value: number, threshold: number): string => {
    const metricNames: { [key: string]: string } = {
      lcp: 'Largest Contentful Paint',
      fid: 'First Input Delay',
      cls: 'Cumulative Layout Shift',
      fcp: 'First Contentful Paint',
      ttfb: 'Time to First Byte',
      memory: 'Memory Usage',
      bundleSize: 'Bundle Size',
    };

    const unit = metric === 'cls' ? '' : metric === 'bundleSize' ? 'KB' : 'ms';
    const formattedValue = metric === 'bundleSize' ? (value / 1024).toFixed(1) : value.toFixed(2);
    
    return `${metricNames[metric] || metric}: ${formattedValue}${unit} (threshold: ${threshold}${unit})`;
  };

  return {
    // State
    performanceData,
    isTracking,
    
    // Actions
    startTracking,
    stopTracking,
    trackInteraction,
    startInteractionTimer,
    updatePerformanceData,
    
    // Utilities
    getRecommendations,
    exportData,
    clearData,
    
    // Raw access to monitors
    performanceMonitor,
    bundleAnalyzer,
  };
};