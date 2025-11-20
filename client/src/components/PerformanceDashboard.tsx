import React, { useState, useEffect } from 'react';
import { Activity, Clock, Zap, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
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
}

export const PerformanceDashboard: React.FC = () => {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateSummary = () => {
      const currentSummary = performanceMonitor.getPerformanceSummary();
      setSummary(currentSummary);
    };

    updateSummary();

    // Auto-refresh every 5 seconds
    const interval = setInterval(updateSummary, 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleClearMetrics = () => {
    performanceMonitor.clearMetrics();
    setSummary(performanceMonitor.getPerformanceSummary());
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

  if (!summary) {
    return (
      <div className="flex items-center justify-center p-8">
        <Activity className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  const getPerformanceColor = (value: number, threshold: number, inverse = false) => {
    if (inverse) {
      return value >= threshold ? 'text-green-600' : value >= threshold * 0.7 ? 'text-yellow-600' : 'text-red-600';
    }
    return value <= threshold ? 'text-green-600' : value <= threshold * 1.5 ? 'text-yellow-600' : 'text-red-600';
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Performance Monitor
          </h2>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
          
          <button
            onClick={handleClearMetrics}
            className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Clear
          </button>
          
          <button
            onClick={handleExportMetrics}
            className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Component Performance */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">Components</h3>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary.totalComponentRenders}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Avg: <span className={getPerformanceColor(summary.averageComponentRenderTime, 16)}>
                {summary.averageComponentRenderTime.toFixed(2)}ms
              </span>
            </div>
            {summary.slowComponentsCount > 0 && (
              <div className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {summary.slowComponentsCount} slow renders
              </div>
            )}
          </div>
        </div>

        {/* API Performance */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">API Calls</h3>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary.totalApiCalls}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Avg: <span className={getPerformanceColor(summary.averageApiCallTime, 500)}>
                {summary.averageApiCallTime.toFixed(2)}ms
              </span>
            </div>
            {summary.slowApiCallsCount > 0 && (
              <div className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {summary.slowApiCallsCount} slow calls
              </div>
            )}
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">Success Rate</h3>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary.apiSuccessRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              API reliability
            </div>
            <div className={`text-sm ${getPerformanceColor(summary.apiSuccessRate, 95, true)}`}>
              {summary.apiSuccessRate >= 95 ? 'Excellent' : 
               summary.apiSuccessRate >= 90 ? 'Good' : 'Needs Improvement'}
            </div>
          </div>
        </div>

        {/* User Interactions */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">Interactions</h3>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary.totalInteractions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              User actions tracked
            </div>
            <div className="text-sm text-green-600">
              Active monitoring
            </div>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Performance Tips</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          {summary.slowComponentsCount > 0 && (
            <li>• Consider optimizing components with render times &gt; 16ms</li>
          )}
          {summary.slowApiCallsCount > 0 && (
            <li>• Some API calls are taking longer than 1 second</li>
          )}
          {summary.apiSuccessRate < 95 && (
            <li>• API success rate could be improved for better reliability</li>
          )}
          {summary.slowComponentsCount === 0 && summary.slowApiCallsCount === 0 && summary.apiSuccessRate >= 95 && (
            <li>• Great job! All performance metrics are within acceptable ranges</li>
          )}
        </ul>
      </div>

      {/* Detailed Metrics */}
      {showDetails && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">Detailed Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Component Metrics</h4>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <div>Total Renders: {summary.totalComponentRenders}</div>
                <div>Average Time: {summary.averageComponentRenderTime.toFixed(2)}ms</div>
                <div>Slow Renders: {summary.slowComponentsCount}</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">API Metrics</h4>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <div>Total Calls: {summary.totalApiCalls}</div>
                <div>Average Time: {summary.averageApiCallTime.toFixed(2)}ms</div>
                <div>Slow Calls: {summary.slowApiCallsCount}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};