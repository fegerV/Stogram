import { memo } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

const THEMES = [
  { value: 'light' as const, icon: Sun, label: 'Светлая' },
  { value: 'dark' as const, icon: Moon, label: 'Тёмная' },
  { value: 'system' as const, icon: Monitor, label: 'Системная' },
];

function ThemeToggleComponent() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-200 p-1 dark:bg-gray-700">
      {THEMES.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={`flex items-center gap-2 rounded-md px-3 py-2 transition-all ${
            theme === value
              ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-800 dark:text-primary-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          title={label}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden text-sm font-medium sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

export default memo(ThemeToggleComponent);
