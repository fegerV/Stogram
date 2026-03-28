import React, { useMemo, useState } from 'react';
import { Activity, X, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useAdvancedPerformance } from '../hooks/useAdvancedPerformance';

interface PerformanceWidgetProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  minimized?: boolean;
  onClose?: () => void;
}

const POSITION_CLASSES = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
} as const;

export const PerformanceWidget: React.FC<PerformanceWidgetProps> = ({
  position = 'bottom-right',
  minimized: initialMinimized = false,
  onClose,
}) => {
  const [minimized, setMinimized] = useState(initialMinimized);
  const { metrics, alerts, clearAlerts, exportMetrics } = useAdvancedPerformance('PerformanceWidget');

  const { criticalAlerts, warningAlerts } = useMemo(
    () => ({
      criticalAlerts: alerts.filter((alert) => alert.severity === 'critical'),
      warningAlerts: alerts.filter((alert) => alert.severity === 'warning'),
    }),
    [alerts],
  );

  const getStatusColor = (
    status: 'good' | 'needs-improvement' | 'poor' | 'warning' | 'critical' | 'unknown',
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
    status: 'good' | 'needs-improvement' | 'poor' | 'warning' | 'critical' | 'unknown',
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

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className={`fixed ${POSITION_CLASSES[position]} z-50 rounded-full bg-gray-900 p-3 text-white shadow-lg transition-all hover:bg-gray-800`}
        title="Открыть монитор производительности"
      >
        <Activity className="h-5 w-5" />
        {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {criticalAlerts.length + warningAlerts.length}
          </div>
        )}
      </button>
    );
  }

  if (!metrics) {
    return (
      <div className={`fixed ${POSITION_CLASSES[position]} z-50 w-80 rounded-lg bg-gray-900 p-4 text-white shadow-xl`}>
        <div className="flex items-center justify-center">
          <Activity className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed ${POSITION_CLASSES[position]} z-50 w-80 overflow-hidden rounded-lg bg-gray-900 text-white shadow-xl`}>
      <div className="border-b border-gray-700 bg-gray-800 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-semibold">Производительность</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="text-gray-400 transition-colors hover:text-white"
              title="Свернуть"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 transition-colors hover:text-white"
                title="Закрыть"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto p-3">
        {alerts.length > 0 && (
          <div className="mb-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-gray-300">Активные предупреждения</h4>
              <button type="button" onClick={clearAlerts} className="text-xs text-gray-400 hover:text-white">
                Очистить
              </button>
            </div>
            <div className="space-y-1">
              {alerts.slice(-3).reverse().map((alert, index) => (
                <div
                  key={index}
                  className={`rounded p-2 text-xs ${
                    alert.severity === 'critical'
                      ? 'border border-red-500 bg-red-900/30'
                      : 'border border-yellow-500 bg-yellow-900/30'
                  }`}
                >
                  <div className="flex items-start gap-1">
                    <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{alert.message}</div>
                      <div className="mt-0.5 text-gray-400">
                        {alert.value.toFixed(2)} / {alert.threshold.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3">
          <h4 className="mb-2 text-xs font-semibold text-gray-300">Core Web Vitals</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded bg-gray-800 p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-gray-400">LCP</span>
                {getStatusIcon(metrics.budgetStatus.lcp)}
              </div>
              <div className={`text-sm font-mono ${getStatusColor(metrics.budgetStatus.lcp)}`}>
                {typeof metrics.lcp === 'number' ? `${metrics.lcp.toFixed(0)}ms` : 'N/A'}
              </div>
            </div>

            <div className="rounded bg-gray-800 p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-gray-400">FID</span>
                {getStatusIcon(metrics.budgetStatus.fid)}
              </div>
              <div className={`text-sm font-mono ${getStatusColor(metrics.budgetStatus.fid)}`}>
                {typeof metrics.fid === 'number' ? `${metrics.fid.toFixed(0)}ms` : 'N/A'}
              </div>
            </div>

            <div className="rounded bg-gray-800 p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-gray-400">CLS</span>
                {getStatusIcon(metrics.budgetStatus.cls)}
              </div>
              <div className={`text-sm font-mono ${getStatusColor(metrics.budgetStatus.cls)}`}>
                {typeof metrics.cls === 'number' ? metrics.cls.toFixed(3) : 'N/A'}
              </div>
            </div>

            <div className="rounded bg-gray-800 p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-gray-400">FPS</span>
              </div>
              <div
                className={`text-sm font-mono ${
                  metrics.fps >= 55 ? 'text-green-500' : metrics.fps >= 30 ? 'text-yellow-500' : 'text-red-500'
                }`}
              >
                {metrics.fps}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <h4 className="mb-2 text-xs font-semibold text-gray-300">Компоненты</h4>
          <div className="space-y-1 rounded bg-gray-800 p-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Рендеры:</span>
              <span className="font-mono">{metrics.componentRenderCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Среднее время:</span>
              <span className={`font-mono ${getStatusColor(metrics.budgetStatus.renderTime)}`}>
                {metrics.componentRenderTime.toFixed(2)}ms
              </span>
            </div>
            {metrics.slowRendersCount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Медленные:</span>
                <span className="font-mono">{metrics.slowRendersCount}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-3">
          <h4 className="mb-2 text-xs font-semibold text-gray-300">API</h4>
          <div className="space-y-1 rounded bg-gray-800 p-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Запросы:</span>
              <span className="font-mono">{metrics.apiCallCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Среднее время:</span>
              <span className={`font-mono ${getStatusColor(metrics.budgetStatus.apiTime)}`}>
                {metrics.apiAverageTime.toFixed(2)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Успешность:</span>
              <span
                className={`font-mono ${
                  metrics.apiSuccessRate >= 95 ? 'text-green-500' : metrics.apiSuccessRate >= 90 ? 'text-yellow-500' : 'text-red-500'
                }`}
              >
                {metrics.apiSuccessRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {metrics.memoryUsage && (
          <div className="mb-3">
            <h4 className="mb-2 text-xs font-semibold text-gray-300">Память</h4>
            <div className="space-y-1 rounded bg-gray-800 p-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Использовано:</span>
                <span className={`font-mono ${getStatusColor(metrics.budgetStatus.memory)}`}>
                  {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
              {metrics.memoryPercentage && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Процент:</span>
                  <span className={`font-mono ${getStatusColor(metrics.budgetStatus.memory)}`}>
                    {metrics.memoryPercentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-gray-700 bg-gray-800 p-2">
        <button
          type="button"
          onClick={exportMetrics}
          className="flex-1 rounded bg-gray-700 px-2 py-1 text-xs transition-colors hover:bg-gray-600"
        >
          Экспорт
        </button>
        <button
          type="button"
          onClick={() => {
            const summary = { metrics, alerts };
            console.log('Performance Summary:', summary);
          }}
          className="flex-1 rounded bg-gray-700 px-2 py-1 text-xs transition-colors hover:bg-gray-600"
        >
          Лог
        </button>
      </div>
    </div>
  );
};
