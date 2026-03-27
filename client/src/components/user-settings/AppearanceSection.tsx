import toast from 'react-hot-toast';
import { monitoredApi } from '../../utils/monitoredApi';
import { SectionLabel } from './SettingsPrimitives';
import { useSettingsI18n } from './i18n';

interface AppearanceSectionProps {
  currentTheme?: string;
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  renderHeader: (title: string) => JSX.Element;
}

export function AppearanceSection({ currentTheme, onThemeChange, renderHeader }: AppearanceSectionProps) {
  const { t } = useSettingsI18n();

  const themeOptions = [
    { value: 'light' as const, label: t('settings.appearance.light'), bg: 'bg-white border border-gray-200' },
    { value: 'dark' as const, label: t('settings.appearance.dark'), bg: 'bg-[#0b141a]' },
    { value: 'system' as const, label: t('settings.appearance.system'), bg: 'bg-gradient-to-br from-white to-[#0b141a]' },
  ];

  return (
    <div className="flex h-full flex-col">
      {renderHeader(t('settings.section.appearance'))}
      <div className="flex-1 overflow-y-auto bg-white p-5 dark:bg-[#17212b]">
        <SectionLabel text={t('settings.appearance.theme')} />
        <div className="mt-2 grid grid-cols-3 gap-3">
          {themeOptions.map((theme) => (
            <button
              key={theme.value}
              onClick={async () => {
                try {
                  if (theme.value !== 'system') {
                    await monitoredApi.patch('/users/theme', { theme: theme.value });
                  }
                  onThemeChange(theme.value);
                  toast.success(t('settings.appearance.changed'));
                } catch {
                  toast.error(t('settings.appearance.error'));
                }
              }}
              className={`rounded-xl border-2 p-3 transition ${
                (currentTheme === theme.value || (!currentTheme && theme.value === 'system'))
                  ? 'border-[#3390ec]'
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className={`mb-2 h-16 w-full rounded-lg ${theme.bg}`} />
              <p className="text-[13px] font-medium text-[#222] dark:text-[#e1e1e1]">{theme.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
