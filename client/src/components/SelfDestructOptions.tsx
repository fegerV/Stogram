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
    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-[#202c33] rounded-lg shadow-xl border border-gray-200 dark:border-[#2a3942] py-2 min-w-[200px] z-50">
      <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2a3942]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#667781] dark:text-[#8696a0]" />
          <span className="text-sm font-medium text-[#111b21] dark:text-[#e9edef]">
            Самоуничтожение
          </span>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onSelect(option.value);
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-gray-100 dark:hover:bg-[#2a3942] transition"
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-gray-200 dark:border-[#2a3942]">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm text-[#667781] dark:text-[#8696a0] hover:bg-gray-100 dark:hover:bg-[#2a3942] rounded transition"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
