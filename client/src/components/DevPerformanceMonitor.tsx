import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../utils/performance';

interface DevPerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const DevPerformanceMonitor: React.FC<DevPerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    if (!enabled) return;

    // Update metrics every second
    const interval = setInterval(() => {
      setSummary(performanceMonitor.getPerformanceSummary());
    }, 1000);

    // FPS monitoring
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFps = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFps);
    };
    
    const animationId = requestAnimationFrame(measureFps);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationId);
    };
  }, [enabled]);

  if (!enabled) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRenderTimeColor = (time: number) => {
    if (time <= 16) return 'text-green-500';
    if (time <= 33) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`fixed ${positionClasses[position]} z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors`}
        style={{ fontSize: '12px' }}
      >
        {isVisible ? '✕' : '⚡'}
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className={`fixed ${positionClasses[position]} z-40 w-80 bg-gray-900 text-white rounded-lg shadow-xl p-4 mt-10`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Performance Monitor</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {summary ? (
            <div className="space-y-3 text-xs">
              {/* FPS */}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">FPS:</span>
                <span className={`font-mono font-bold ${getFpsColor(fps)}`}>
                  {fps}
                </span>
              </div>

              {/* Component Renders */}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Components:</span>
                <span className="font-mono">
                  {summary.totalComponentRenders}
                </span>
              </div>

              {/* Avg Render Time */}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Avg Render:</span>
                <span className={`font-mono ${getRenderTimeColor(summary.averageComponentRenderTime)}`}>
                  {summary.averageComponentRenderTime.toFixed(2)}ms
                </span>
              </div>

              {/* Slow Components */}
              {summary.slowComponentsCount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Slow Renders:</span>
                  <span className="font-mono text-red-500">
                    {summary.slowComponentsCount}
                  </span>
                </div>
              )}

              {/* API Calls */}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">API Calls:</span>
                <span className="font-mono">
                  {summary.totalApiCalls}
                </span>
              </div>

              {/* Avg API Time */}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Avg API:</span>
                <span className="font-mono">
                  {summary.averageApiCallTime.toFixed(2)}ms
                </span>
              </div>

              {/* Success Rate */}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Success Rate:</span>
                <span className={`font-mono ${summary.apiSuccessRate >= 95 ? 'text-green-500' : 'text-yellow-500'}`}>
                  {summary.apiSuccessRate.toFixed(1)}%
                </span>
              </div>

              {/* Memory Usage */}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Memory:</span>
                <span className="font-mono">
                  {((performance as any).memory ? 
                    `${((performance as any).memory.usedJSHeapSize / 1048576).toFixed(1)}MB` : 
                    'N/A')}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-700">
                <button
                  onClick={() => performanceMonitor.clearMetrics()}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    const metrics = performanceMonitor.exportMetrics();
                    console.log('Performance Metrics:', metrics);
                  }}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                >
                  Log
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400">Loading metrics...</div>
          )}
        </div>
      )}
    </>
  );
};