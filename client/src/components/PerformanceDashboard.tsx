import React, { useState, useEffect } from 'react';
import { Activity, Clock, Zap, AlertTriangle, TrendingUp, BarChart3, Cpu, Package, HardDrive } from 'lucide-react';
import { performanceMonitor } from '../utils/performance';

interface PerformanceSummary {
  totalComponentRenders: number;
  averageComponentRenderTime: number;
  slowComponentsCount: number;
  totalApiCalls: number;
  averageApiCallTime: number;
  slowApiCallsCount: number;
  totalInteractions: number;
  apiSuccessRate: number;
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
  bundles: {
    totalSize: number;
    averageLoadTime: number;
    count: number;
  };
  memory: {
    usageRatio: number;
    usedHeapMB: number;
    totalHeapMB: number;
  };
  performanceAlertsCount: number;
}

export const PerformanceDashboard: React.FC = () => {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const updateSummary = () => {
      const currentSummary = performanceMonitor.getPerformanceSummary();
      setSummary(currentSummary);
    };

    const handlePerformanceAlert = (event: CustomEvent) => {
      setAlerts(prev => [event.detail, ...prev.slice(0, 9)]); // Keep last 10 alerts
    };

    updateSummary();

    // Auto-refresh every 5 seconds
    const interval = setInterval(updateSummary, 5000);

    // Listen for performance alerts
    window.addEventListener('performanceAlert', handlePerformanceAlert as EventListener);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('performanceAlert', handlePerformanceAlert as EventListener);
    };
  }, []);

  const handleClearMetrics = () => {
    performanceMonitor.clearMetrics();
    setSummary(performanceMonitor.getPerformanceSummary());
    setAlerts([]);
  };

  const handleExportMetrics = () => {
    const metrics = performanceMonitor.exportMetrics();
    const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getVitalStatus = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value <= threshold : value <= threshold;
    return isGood ? 'text-green-600' : value <= threshold * 1.5 ? 'text-yellow-600' : 'text-red-600';
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!summary) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Performance Dashboard
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {showDetails ? 'Simple' : 'Detailed'}
          </button>
          <button
            onClick={handleExportMetrics}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
          >
            Export
          </button>
          <button
            onClick={handleClearMetrics}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Performance Alerts ({alerts.length})
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {alerts.map((alert, index) => (
              <div key={index} className="text-sm text-red-700 dark:text-red-300">
                <strong>{alert.metric}:</strong> {alert.value.toFixed(2)} (budget: {alert.budget})
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">LCP</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className={`text-xl font-bold ${getVitalStatus(summary.coreWebVitals.lcp, 2500)}`}>
            {summary.coreWebVitals.lcp.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Largest Contentful Paint</div>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">FID</span>
            <Zap className="w-4 h-4 text-green-600" />
          </div>
          <div className={`text-xl font-bold ${getVitalStatus(summary.coreWebVitals.fid, 100)}`}>
            {summary.coreWebVitals.fid.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">First Input Delay</div>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">CLS</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className={`text-xl font-bold ${getVitalStatus(summary.coreWebVitals.cls, 0.1)}`}>
            {summary.coreWebVitals.cls.toFixed(3)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Cumulative Layout Shift</div>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">FCP</span>
            <Activity className="w-4 h-4 text-orange-600" />
          </div>
          <div className={`text-xl font-bold ${getVitalStatus(summary.coreWebVitals.fcp, 1800)}`}>
            {summary.coreWebVitals.fcp.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">First Contentful Paint</div>
        </div>

        <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">TTFB</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <div className={`text-xl font-bold ${getVitalStatus(summary.coreWebVitals.ttfb, 800)}`}>
            {summary.coreWebVitals.ttfb.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Time to First Byte</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Memory Usage */}
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Memory</span>
            <HardDrive className="w-4 h-4 text-indigo-600" />
          </div>
          <div className={`text-xl font-bold ${getVitalStatus(summary.memory.usageRatio, 0.8)}`}>
            {(summary.memory.usageRatio * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {summary.memory.usedHeapMB.toFixed(1)}MB / {summary.memory.totalHeapMB.toFixed(1)}MB
          </div>
        </div>

        {/* Bundle Size */}
        <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Bundles</span>
            <Package className="w-4 h-4 text-pink-600" />
          </div>
          <div className={`text-xl font-bold ${getVitalStatus(summary.bundles.totalSize, 1024 * 1024)}`}>
            {formatBytes(summary.bundles.totalSize)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {summary.bundles.count} bundles • {summary.bundles.averageLoadTime.toFixed(0)}ms avg load
          </div>
        </div>

        {/* Component Performance */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Components</span>
            <Cpu className="w-4 h-4 text-yellow-600" />
          </div>
          <div className={`text-xl font-bold ${getVitalStatus(summary.averageComponentRenderTime, 16)}`}>
            {summary.averageComponentRenderTime.toFixed(1)}ms
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {summary.totalComponentRenders} renders • {summary.slowComponentsCount} slow
          </div>
        </div>

        {/* API Performance */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">API</span>
            <Activity className="w-4 h-4 text-green-600" />
          </div>
          <div className={`text-xl font-bold ${getVitalStatus(summary.averageApiCallTime, 1000)}`}>
            {summary.averageApiCallTime.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {summary.apiSuccessRate.toFixed(1)}% success • {summary.slowApiCallsCount} slow
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detailed Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Rendering</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Renders:</span>
                  <span className="font-medium">{summary.totalComponentRenders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Avg Render Time:</span>
                  <span className="font-medium">{summary.averageComponentRenderTime.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Slow Components:</span>
                  <span className="font-medium text-red-600">{summary.slowComponentsCount}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">API Calls</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Calls:</span>
                  <span className="font-medium">{summary.totalApiCalls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Avg Response Time:</span>
                  <span className="font-medium">{summary.averageApiCallTime.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                  <span className="font-medium">{summary.apiSuccessRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">User Interactions</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Interactions:</span>
                  <span className="font-medium">{summary.totalInteractions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Performance Alerts:</span>
                  <span className="font-medium text-red-600">{summary.performanceAlertsCount}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Bundle Analysis</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Size:</span>
                  <span className="font-medium">{formatBytes(summary.bundles.totalSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Bundle Count:</span>
                  <span className="font-medium">{summary.bundles.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Avg Load Time:</span>
                  <span className="font-medium">{summary.bundles.averageLoadTime.toFixed(2)}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};