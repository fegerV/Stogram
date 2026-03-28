import React, { useEffect, useState } from 'react';
import { performanceMonitor } from '../utils/performance';

interface DevPerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const DevPerformanceMonitor: React.FC<DevPerformanceMonitorProps> = ({
  enabled = import.meta.env.DEV,
  position = 'top-right',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [fps, setFps] = useState(60);
  const [webVitals, setWebVitals] = useState<any>({});

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setSummary(performanceMonitor.getPerformanceSummary());
      setWebVitals(performanceMonitor.getWebVitals());
    }, 1000);

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

  const getFpsColor = (value: number) => {
    if (value >= 55) return 'text-emerald-400';
    if (value >= 30) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getRenderTimeColor = (value: number) => {
    if (value <= 16) return 'text-emerald-400';
    if (value <= 33) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getWebVitalColor = (name: string, value: number) => {
    if (!value) return 'text-slate-400';

    switch (name) {
      case 'LCP':
        return value <= 2500 ? 'text-emerald-400' : value <= 4000 ? 'text-amber-400' : 'text-rose-400';
      case 'FID':
        return value <= 100 ? 'text-emerald-400' : value <= 300 ? 'text-amber-400' : 'text-rose-400';
      case 'CLS':
        return value <= 0.1 ? 'text-emerald-400' : value <= 0.25 ? 'text-amber-400' : 'text-rose-400';
      case 'INP':
        return value <= 200 ? 'text-emerald-400' : value <= 500 ? 'text-amber-400' : 'text-rose-400';
      case 'TTFB':
        return value <= 800 ? 'text-emerald-400' : value <= 1800 ? 'text-amber-400' : 'text-rose-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        className={`fixed ${positionClasses[position]} z-50 rounded-2xl border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs font-medium text-white shadow-xl backdrop-blur`}
      >
        {isVisible ? 'Скрыть' : 'Perf'}
      </button>

      {isVisible && (
        <div
          className={`fixed ${positionClasses[position]} z-40 mt-12 max-h-[80vh] w-80 overflow-y-auto rounded-[26px] border border-slate-700 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Монитор производительности</h3>
            <button type="button" onClick={() => setIsVisible(false)} className="text-slate-400 hover:text-white">
              ×
            </button>
          </div>

          {summary ? (
            <div className="space-y-3 text-xs">
              {Object.keys(webVitals).length > 0 && (
                <div className="border-t border-slate-800 pt-2">
                  <h4 className="mb-2 font-semibold text-cyan-400">Web Vitals</h4>
                  {Object.entries(webVitals).map(([name, vital]: [string, any]) => (
                    <div key={name} className="mb-1 flex items-center justify-between">
                      <span className="text-slate-400">{name}:</span>
                      <span className={`font-mono ${getWebVitalColor(name, vital.value)}`}>
                        {name === 'CLS' ? vital.value.toFixed(3) : `${vital.value.toFixed(0)}ms`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-800 pt-2">
                <h4 className="mb-2 font-semibold text-cyan-400">Интерфейс</h4>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">FPS:</span>
                  <span className={`font-mono font-bold ${getFpsColor(fps)}`}>{fps}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Рендеры:</span>
                  <span className="font-mono">{summary.totalComponentRenders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Средний рендер:</span>
                  <span className={`font-mono ${getRenderTimeColor(summary.averageComponentRenderTime)}`}>
                    {summary.averageComponentRenderTime.toFixed(2)}ms
                  </span>
                </div>
                {summary.slowComponentsCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Медленные компоненты:</span>
                    <span className="font-mono text-rose-400">{summary.slowComponentsCount}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800 pt-2">
                <h4 className="mb-2 font-semibold text-cyan-400">API</h4>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Запросы:</span>
                  <span className="font-mono">{summary.totalApiCalls}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Среднее время:</span>
                  <span className="font-mono">{summary.averageApiCallTime.toFixed(2)}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Успешность:</span>
                  <span className={`font-mono ${summary.apiSuccessRate >= 95 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {summary.apiSuccessRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {summary.totalResourcesLoaded > 0 && (
                <div className="border-t border-slate-800 pt-2">
                  <h4 className="mb-2 font-semibold text-cyan-400">Ресурсы</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Загружено:</span>
                    <span className="font-mono">{summary.totalResourcesLoaded}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Размер:</span>
                    <span className="font-mono">{(summary.totalResourceSize / 1024 / 1024).toFixed(2)}MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Средняя загрузка:</span>
                    <span className="font-mono">{summary.averageResourceLoadTime.toFixed(2)}ms</span>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-800 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Память:</span>
                  <span className="font-mono">
                    {(performance as any).memory
                      ? `${((performance as any).memory.usedJSHeapSize / 1048576).toFixed(1)}MB`
                      : 'Недоступно'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 border-t border-slate-800 pt-2">
                <button
                  type="button"
                  onClick={() => performanceMonitor.clearMetrics()}
                  className="rounded-xl bg-slate-800 px-2 py-1 hover:bg-slate-700"
                >
                  Очистить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const metrics = performanceMonitor.exportMetrics();
                    console.log('Performance Metrics:', metrics);
                  }}
                  className="rounded-xl bg-slate-800 px-2 py-1 hover:bg-slate-700"
                >
                  Лог
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const bundleAnalysis = performanceMonitor.getBundleAnalysis();
                    console.log('Bundle Analysis:', bundleAnalysis);
                  }}
                  className="rounded-xl bg-slate-800 px-2 py-1 hover:bg-slate-700"
                >
                  Бандл
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400">Загружаем метрики...</div>
          )}
        </div>
      )}
    </>
  );
};
