import { Globe } from 'lucide-react';
import { useSettingsI18n } from './i18n';
import { SettingsLocale } from './i18n';
import { SectionLabel } from './SettingsPrimitives';

interface LanguageSectionProps {
  renderHeader: (title: string) => JSX.Element;
}

const options: SettingsLocale[] = ['ru', 'en'];

export function LanguageSection({ renderHeader }: LanguageSectionProps) {
  const { locale, setLocale, t } = useSettingsI18n();

  return (
    <div className="flex h-full flex-col">
      {renderHeader(t('settings.section.language'))}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
        <SectionLabel text={t('settings.section.language')} />
        <div className="space-y-3 px-5 pb-5">
          {options.map((option) => {
            const active = locale === option;
            const label =
              option === 'ru' ? t('settings.languageValueRu') : t('settings.languageValueEn');

            return (
              <button
                key={option}
                onClick={() => setLocale(option)}
                className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition ${
                  active
                    ? 'border-[#3390ec] bg-[#3390ec]/10'
                    : 'border-gray-200 bg-[#efeff4] hover:border-[#3390ec]/40 dark:border-[#202c33] dark:bg-[#202b36]'
                }`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3390ec] text-white">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-[#222] dark:text-[#e1e1e1]">{label}</p>
                  <p className="text-[13px] text-[#8e8e93] dark:text-[#6c7883]">
                    {t('settings.languageDescription')}
                  </p>
                </div>
                {active && <span className="text-[13px] font-medium text-[#3390ec]">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
