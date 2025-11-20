import React, { useState } from 'react';
import { Activity, X, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useAdvancedPerformance } from '../hooks/useAdvancedPerformance';

interface PerformanceWidgetProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  minimized?: boolean;
  onClose?: () => void;
}

export const PerformanceWidget: React.FC<PerformanceWidgetProps> = ({
  position = 'bottom-right',
  minimized: initialMinimized = false,
  onClose,
}) => {
  const [minimized, setMinimized] = useState(initialMinimized);
  const { metrics, alerts, clearAlerts, exportMetrics } = useAdvancedPerformance('PerformanceWidget');

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getStatusColor = (
    status: 'good' | 'needs-improvement' | 'poor' | 'warning' | 'critical' | 'unknown'
  ) => {
    switch (status) {
      case 'good':
        return 'text-green-500';
      case 'needs-improvement':
      case 'warning':
        return 'text-yellow-500';
      case 'poor':
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (
    status: 'good' | 'needs-improvement' | 'poor' | 'warning' | 'critical' | 'unknown'
  ) => {
    switch (status) {
      case 'good':
        return <TrendingUp className="h-3 w-3" />;
      case 'needs-improvement':
      case 'warning':
        return <AlertTriangle className="h-3 w-3" />;
      case 'poor':
      case 'critical':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className={`fixed ${positionClasses[position]} z-50 p-3 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-all`}
        title="Open Performance Monitor"
      >
        <Activity className="h-5 w-5" />
        {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
          <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
            {criticalAlerts.length + warningAlerts.length}
          </div>
        )}
      </button>
    );
  }

  if (!metrics) {
    return (
      <div
        className={`fixed ${positionClasses[position]} z-50 w-80 bg-gray-900 text-white rounded-lg shadow-xl p-4`}
      >
        <div className="flex items-center justify-center">
          <Activity className="animate-spin h-6 w-6" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 w-80 bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-400" />
          <h3 className="text-sm font-semibold">Performance</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMinimized(true)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Minimize"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 max-h-96 overflow-y-auto">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-300">Active Alerts</h4>
              <button
                onClick={clearAlerts}
                className="text-xs text-gray-400 hover:text-white"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {alerts.slice(-3).reverse().map((alert, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-xs ${
                    alert.severity === 'critical'
                      ? 'bg-red-900/30 border border-red-500'
                      : 'bg-yellow-900/30 border border-yellow-500'
                  }`}
                >
                  <div className="flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-gray-400 mt-0.5">
                        {alert.value.toFixed(2)} / {alert.threshold.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Core Web Vitals */}
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-300 mb-2">Core Web Vitals</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">LCP</span>
                {getStatusIcon(metrics.budgetStatus.lcp)}
              </div>
              <div className={`text-sm font-mono ${getStatusColor(metrics.budgetStatus.lcp)}`}>
                {typeof metrics.lcp === 'number' ? `${metrics.lcp.toFixed(0)}ms` : 'N/A'}
              </div>
            </div>

            <div className="bg-gray-800 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">FID</span>
                {getStatusIcon(metrics.budgetStatus.fid)}
              </div>
              <div className={`text-sm font-mono ${getStatusColor(metrics.budgetStatus.fid)}`}>
                {typeof metrics.fid === 'number' ? `${metrics.fid.toFixed(0)}ms` : 'N/A'}
              </div>
            </div>

            <div className="bg-gray-800 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">CLS</span>
                {getStatusIcon(metrics.budgetStatus.cls)}
              </div>
              <div className={`text-sm font-mono ${getStatusColor(metrics.budgetStatus.cls)}`}>
                {typeof metrics.cls === 'number' ? metrics.cls.toFixed(3) : 'N/A'}
              </div>
            </div>

            <div className="bg-gray-800 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">FPS</span>
              </div>
              <div
                className={`text-sm font-mono ${
                  metrics.fps >= 55
                    ? 'text-green-500'
                    : metrics.fps >= 30
                    ? 'text-yellow-500'
                    : 'text-red-500'
                }`}
              >
                {metrics.fps}
              </div>
            </div>
          </div>
        </div>

        {/* Component Performance */}
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-300 mb-2">Components</h4>
          <div className="bg-gray-800 rounded p-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Renders:</span>
              <span className="font-mono">{metrics.componentRenderCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Time:</span>
              <span
                className={`font-mono ${getStatusColor(metrics.budgetStatus.renderTime)}`}
              >
                {metrics.componentRenderTime.toFixed(2)}ms
              </span>
            </div>
            {metrics.slowRendersCount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Slow:</span>
                <span className="font-mono">{metrics.slowRendersCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* API Performance */}
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-300 mb-2">API</h4>
          <div className="bg-gray-800 rounded p-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Calls:</span>
              <span className="font-mono">{metrics.apiCallCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Time:</span>
              <span className={`font-mono ${getStatusColor(metrics.budgetStatus.apiTime)}`}>
                {metrics.apiAverageTime.toFixed(2)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Success:</span>
              <span
                className={`font-mono ${
                  metrics.apiSuccessRate >= 95
                    ? 'text-green-500'
                    : metrics.apiSuccessRate >= 90
                    ? 'text-yellow-500'
                    : 'text-red-500'
                }`}
              >
                {metrics.apiSuccessRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Memory */}
        {metrics.memoryUsage && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-gray-300 mb-2">Memory</h4>
            <div className="bg-gray-800 rounded p-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Used:</span>
                <span className={`font-mono ${getStatusColor(metrics.budgetStatus.memory)}`}>
                  {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
              {metrics.memoryPercentage && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Usage:</span>
                  <span className={`font-mono ${getStatusColor(metrics.budgetStatus.memory)}`}>
                    {metrics.memoryPercentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 p-2 bg-gray-800 border-t border-gray-700">
        <button
          onClick={exportMetrics}
          className="flex-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          Export
        </button>
        <button
          onClick={() => {
            const summary = { metrics, alerts };
            console.log('Performance Summary:', summary);
          }}
          className="flex-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          Log
        </button>
      </div>
    </div>
  );
};
