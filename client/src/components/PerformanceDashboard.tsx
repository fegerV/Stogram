import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, Clock, Gauge, TrendingUp, Zap } from 'lucide-react';
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
  webVitals?: {
    [key: string]: {
      name: string;
      value: number;
      rating: 'good' | 'needs-improvement' | 'poor';
    };
  };
}

const getPerformanceColor = (value: number, threshold: number, inverse = false) => {
  if (inverse) {
    return value >= threshold ? 'text-emerald-500' : value >= threshold * 0.7 ? 'text-amber-500' : 'text-rose-500';
  }
  return value <= threshold ? 'text-emerald-500' : value <= threshold * 1.5 ? 'text-amber-500' : 'text-rose-500';
};

const StatCard = ({
  icon: Icon,
  title,
  accent,
  value,
  lines,
}: {
  icon: typeof Activity;
  title: string;
  accent: string;
  value: string | number;
  lines: React.ReactNode[];
}) => (
  <div className="rounded-3xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-800/80">
    <div className="mb-3 flex items-center gap-2">
      <Icon className={`h-5 w-5 ${accent}`} />
      <h3 className="font-medium text-slate-900 dark:text-white">{title}</h3>
    </div>
    <div className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
    <div className="mt-2 space-y-1 text-sm text-slate-500 dark:text-slate-400">{lines}</div>
  </div>
);

export const PerformanceDashboard: React.FC = () => {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateSummary = () => {
      setSummary(performanceMonitor.getPerformanceSummary());
    };

    updateSummary();
    const interval = setInterval(updateSummary, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleClearMetrics = () => {
    performanceMonitor.clearMetrics();
    setSummary(performanceMonitor.getPerformanceSummary());
  };

  const handleExportMetrics = () => {
    const metrics = performanceMonitor.exportMetrics();
    const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!summary) {
    return (
      <div className="flex items-center justify-center p-8">
        <Activity className="h-8 w-8 animate-spin text-[#3390ec]" />
      </div>
    );
  }

  const tips: string[] = [];
  if (summary.slowComponentsCount > 0) tips.push('Есть медленные рендеры компонентов. Проверьте части UI со временем больше 16 мс.');
  if (summary.slowApiCallsCount > 0) tips.push('Некоторые API-запросы работают дольше секунды. Имеет смысл посмотреть сетевой слой и кэширование.');
  if (summary.apiSuccessRate < 95) tips.push('Надёжность API можно улучшить: часть запросов завершается ошибкой.');
  if (summary.webVitals?.LCP && summary.webVitals.LCP.value > 2500) {
    tips.push('LCP выше комфортного порога. Оптимизируйте первый экран и критические ассеты.');
  }
  if (summary.webVitals?.CLS && summary.webVitals.CLS.value > 0.1) {
    tips.push('CLS выше нормы. Зафиксируйте размеры медиа и сократите layout shift.');
  }
  if (tips.length === 0) {
    tips.push('Метрики в пределах нормы. Можно переходить к точечной полировке UX и bundle splitting.');
  }

  return (
    <div className="rounded-[30px] border border-slate-200/80 bg-white/95 p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[#3390ec]/10 p-2 text-[#3390ec]">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Монитор производительности</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Живая сводка по рендерам, API и Core Web Vitals.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowDetails((current) => !current)}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {showDetails ? 'Скрыть детали' : 'Показать детали'}
          </button>
          <button
            type="button"
            onClick={handleClearMetrics}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Очистить
          </button>
          <button
            type="button"
            onClick={handleExportMetrics}
            className="rounded-2xl bg-[#3390ec] px-4 py-2 text-sm text-white transition hover:bg-[#2c83d9]"
          >
            Экспорт
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Clock}
          title="Компоненты"
          accent="text-blue-500"
          value={summary.totalComponentRenders}
          lines={[
            <div key="avg">
              Среднее:{' '}
              <span className={getPerformanceColor(summary.averageComponentRenderTime, 16)}>
                {summary.averageComponentRenderTime.toFixed(2)} мс
              </span>
            </div>,
            summary.slowComponentsCount > 0 ? (
              <div key="slow" className="flex items-center gap-1 text-rose-500">
                <AlertTriangle className="h-3 w-3" />
                {summary.slowComponentsCount} медленных рендеров
              </div>
            ) : (
              <div key="ok" className="text-emerald-500">Критичных задержек нет</div>
            ),
          ]}
        />

        <StatCard
          icon={Zap}
          title="API"
          accent="text-emerald-500"
          value={summary.totalApiCalls}
          lines={[
            <div key="avg">
              Среднее:{' '}
              <span className={getPerformanceColor(summary.averageApiCallTime, 500)}>
                {summary.averageApiCallTime.toFixed(2)} мс
              </span>
            </div>,
            summary.slowApiCallsCount > 0 ? (
              <div key="slow" className="flex items-center gap-1 text-rose-500">
                <AlertTriangle className="h-3 w-3" />
                {summary.slowApiCallsCount} медленных вызовов
              </div>
            ) : (
              <div key="ok" className="text-emerald-500">Сетевой слой стабилен</div>
            ),
          ]}
        />

        <StatCard
          icon={TrendingUp}
          title="Успешность API"
          accent="text-fuchsia-500"
          value={`${summary.apiSuccessRate.toFixed(1)}%`}
          lines={[
            <div key="label">Надёжность сетевых запросов</div>,
            <div key="quality" className={getPerformanceColor(summary.apiSuccessRate, 95, true)}>
              {summary.apiSuccessRate >= 95 ? 'Отлично' : summary.apiSuccessRate >= 90 ? 'Хорошо' : 'Нужно улучшить'}
            </div>,
          ]}
        />

        <StatCard
          icon={BarChart3}
          title="Взаимодействия"
          accent="text-orange-500"
          value={summary.totalInteractions}
          lines={[
            <div key="label">Отслеживаемые действия пользователя</div>,
            <div key="ok" className="text-emerald-500">Мониторинг активен</div>,
          ]}
        />
      </div>

      {summary.webVitals && Object.keys(summary.webVitals).length > 0 && (
        <div className="mb-6 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-800/70">
          <div className="mb-4 flex items-center gap-2">
            <Gauge className="h-5 w-5 text-indigo-500" />
            <h3 className="font-medium text-slate-900 dark:text-white">Core Web Vitals</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {Object.values(summary.webVitals).map((vital) => (
              <div key={vital.name} className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{vital.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      vital.rating === 'good'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : vital.rating === 'needs-improvement'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                    }`}
                  >
                    {vital.rating === 'good' ? 'Норма' : vital.rating === 'needs-improvement' ? 'Улучшить' : 'Плохо'}
                  </span>
                </div>

                <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {vital.name === 'CLS' ? vital.value.toFixed(3) : `${vital.value.toFixed(0)} мс`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-blue-200/70 bg-blue-50/90 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
        <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-100">Рекомендации</h3>
        <ul className="space-y-2 text-sm leading-6 text-blue-800 dark:text-blue-200">
          {tips.map((tip) => (
            <li key={tip}>• {tip}</li>
          ))}
        </ul>
      </div>

      {showDetails && (
        <div className="mt-6 grid gap-4 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-800/70 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-medium text-slate-900 dark:text-white">Компоненты</h4>
            <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
              <div>Всего рендеров: {summary.totalComponentRenders}</div>
              <div>Среднее время: {summary.averageComponentRenderTime.toFixed(2)} мс</div>
              <div>Медленных рендеров: {summary.slowComponentsCount}</div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-medium text-slate-900 dark:text-white">API</h4>
            <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
              <div>Всего вызовов: {summary.totalApiCalls}</div>
              <div>Среднее время: {summary.averageApiCallTime.toFixed(2)} мс</div>
              <div>Медленных вызовов: {summary.slowApiCallsCount}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
