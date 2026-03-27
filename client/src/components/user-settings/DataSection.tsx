import { ChevronRight, Download, HardDrive, Trash2, Upload } from 'lucide-react';
import { Divider, MenuRow } from './SettingsPrimitives';
import { StorageInfo } from './types';
import { useSettingsI18n } from './i18n';

interface DataSectionProps {
  loadingStorage: boolean;
  storageInfo: StorageInfo | null;
  onClearCache: () => void;
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  renderHeader: (title: string) => JSX.Element;
}

export function DataSection({
  loadingStorage,
  storageInfo,
  onClearCache,
  onExportData,
  onImportData,
  renderHeader,
}: DataSectionProps) {
  const { t } = useSettingsI18n();

  return (
    <div className="flex h-full flex-col">
      {renderHeader(t('settings.section.data'))}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
        {loadingStorage ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#3390ec]" />
          </div>
        ) : storageInfo ? (
          <>
            <div className="px-5 py-5">
              <div className="rounded-xl bg-gradient-to-br from-[#3390ec]/10 to-[#3390ec]/5 p-5 dark:from-[#3390ec]/20 dark:to-[#3390ec]/10">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-[13px] font-medium uppercase text-[#8e8e93]">{t('settings.data.totalUsage')}</p>
                  <HardDrive className="h-5 w-5 text-[#3390ec]" />
                </div>
                <p className="text-[28px] font-bold text-[#222] dark:text-white">{storageInfo.total.formatted}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 px-5 pb-3">
              {[
                { label: t('settings.data.messages'), value: storageInfo.messages.count },
                { label: t('settings.data.media'), value: storageInfo.media.count },
                { label: t('settings.data.contacts'), value: storageInfo.contacts.count },
                { label: t('settings.data.chats'), value: storageInfo.chats.count },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-[#efeff4] p-3 dark:bg-[#202b36]">
                  <p className="text-[12px] text-[#8e8e93]">{item.label}</p>
                  <p className="text-[18px] font-semibold text-[#222] dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <Divider />

            <MenuRow icon={Trash2} label={t('settings.data.clearCache')} onClick={onClearCache} color="text-[#e67e22]" />
            <div className="ml-5 h-px bg-gray-100 dark:bg-[#202c33]" />
            <MenuRow icon={Download} label={t('settings.data.export')} onClick={onExportData} color="text-[#3390ec]" />
            <div className="ml-5 h-px bg-gray-100 dark:bg-[#202c33]" />
            <div className="px-5 py-3.5">
              <label className="flex cursor-pointer items-center gap-5">
                <Upload className="h-[22px] w-[22px] text-[#4fae4e]" />
                <div className="flex-1">
                  <p className="text-[15px] text-[#222] dark:text-[#e1e1e1]">{t('settings.data.import')}</p>
                </div>
                <input type="file" accept=".json" onChange={onImportData} className="hidden" />
                <ChevronRight className="h-4 w-4 text-[#c7c7cc] dark:text-[#4e5b65]" />
              </label>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
