import { Clock } from 'lucide-react';

interface SelfDestructOptionsProps {
  onSelect: (seconds: number) => void;
  onClose: () => void;
}

const options = [
  { label: '5 секунд', value: 5 },
  { label: '10 секунд', value: 10 },
  { label: '30 секунд', value: 30 },
  { label: '1 минута', value: 60 },
  { label: '5 минут', value: 300 },
  { label: '1 час', value: 3600 },
  { label: '1 день', value: 86400 },
  { label: '1 неделя', value: 604800 },
];

export default function SelfDestructOptions({ onSelect, onClose }: SelfDestructOptionsProps) {
  return (
    <div className="absolute bottom-full left-0 z-50 mb-2 min-w-[220px] rounded-[24px] border border-slate-200/80 bg-white/95 py-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95">
      <div className="border-b border-slate-200/80 px-3 py-2 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-900 dark:text-white">Самоуничтожение</span>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onSelect(option.value);
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="border-t border-slate-200/80 px-3 py-2 dark:border-slate-700">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
