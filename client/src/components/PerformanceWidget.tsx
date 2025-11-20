import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Monitor, 
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { useAdvancedPerformance } from '../hooks/useAdvancedPerformance';

interface PerformanceWidgetProps {
  componentName?: string;
  minimal?: boolean;
  showOnlyAlerts?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const PerformanceWidget: React.FC<PerformanceWidgetProps> = ({
  componentName = 'App',
  minimal = false,
  showOnlyAlerts = false,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [realTimeMode, setRealTimeMode] = useState(true);

  const {
    performanceData,
    startTracking,
    stopTracking,
    getRecommendations,
    exportData,
    clearData
  } = useAdvancedPerformance(componentName, {
    trackComponentRenders: true,
    trackInteractions: true,
    enableAlerts: true,
  });

  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);

  const positionClasses = {
    'top-right': 'fixed top-4 right-4',
    'top-left': 'fixed top-4 left-4',
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
  };

  const getPerformanceScore = () => {
    const { webVitals, memoryUsage, averageRenderTime } = performanceData;
    
    let score = 100;
    
    // Web Vitals scoring
    if (webVitals.lcp > 2500) score -= 20;
    else if (webVitals.lcp > 1800) score -= 10;
    
    if (webVitals.fid > 100) score -= 20;
    else if (webVitals.fid > 50) score -= 10;
    
    if (webVitals.cls > 0.25) score -= 20;
    else if (webVitals.cls > 0.1) score -= 10;
    
    if (webVitals.fcp > 3000) score -= 15;
    else if (webVitals.fcp > 1800) score -= 8;
    
    // Memory scoring
    if (memoryUsage > 0.9) score -= 20;
    else if (memoryUsage > 0.7) score -= 10;
    
    // Render time scoring
    if (averageRenderTime > 33) score -= 20;
    else if (averageRenderTime > 16) score -= 10;
    
    return Math.max(0, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const performanceScore = getPerformanceScore();
  const criticalAlerts = performanceData.alerts.filter(alert => alert.severity === 'high');
  const recommendations = getRecommendations();

  if (!isVisible) {
    return (
      <div className={`${positionClasses[position]} z-50`}>
        <button
          onClick={() => setIsVisible(true)}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    );
  }

  if (minimal) {
    return (
      <div className={`${positionClasses[position]} z-50`}>
        <div className={`p-3 ${getScoreBackground(performanceScore)} rounded-lg shadow-lg border border-gray-200 dark:border-gray-700`}>
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${getScoreColor(performanceScore)}`} />
            <span className={`text-sm font-bold ${getScoreColor(performanceScore)}`}>
              {performanceScore}
            </span>
            {criticalAlerts.length > 0 && (
              <AlertTriangle className="w-3 h-3 text-red-500" />
            )}
            <button
              onClick={() => setIsVisible(false)}
              className="ml-auto p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <EyeOff className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showOnlyAlerts && criticalAlerts.length === 0) {
    return null;
  }

  return (
    <div className={`${positionClasses[position]} z-50 w-80`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className={`p-3 ${getScoreBackground(performanceScore)} rounded-t-lg border-b border-gray-200 dark:border-gray-700`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className={`w-5 h-5 ${getScoreColor(performanceScore)}`} />
              <span className="font-semibold text-gray-900 dark:text-white">
                Performance
              </span>
              <span className={`text-lg font-bold ${getScoreColor(performanceScore)}`}>
                {performanceScore}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRealTimeMode(!realTimeMode)}
                className={`p-1 rounded ${realTimeMode ? 'bg-blue-100 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title={realTimeMode ? 'Real-time mode' : 'Manual mode'}
              >
                <RefreshCw className={`w-3 h-3 ${realTimeMode ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`} />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Settings className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <EyeOff className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-800 dark:text-red-200">
                {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {criticalAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="text-xs text-red-700 dark:text-red-300">
                  {alert.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-600 dark:text-gray-400">Renders</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {performanceData.componentRenders}
              </div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Avg Time</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {performanceData.averageRenderTime.toFixed(1)}ms
              </div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Memory</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {(performanceData.memoryUsage * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Bundle</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {(performanceData.bundleSize / 1024).toFixed(0)}KB
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            {/* Web Vitals */}
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Core Web Vitals</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">LCP:</span>
                  <span className="font-medium">{performanceData.webVitals.lcp.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">FID:</span>
                  <span className="font-medium">{performanceData.webVitals.fid.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">CLS:</span>
                  <span className="font-medium">{performanceData.webVitals.cls.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">FCP:</span>
                  <span className="font-medium">{performanceData.webVitals.fcp.toFixed(0)}ms</span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Recommendations</h4>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="text-xs text-blue-700 dark:text-blue-300">
                      • {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="p-3 flex gap-2">
          <button
            onClick={exportData}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
          <button
            onClick={clearData}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};