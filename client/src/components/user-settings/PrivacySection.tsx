import { SectionLabel, ToggleRow } from './SettingsPrimitives';
import { useSettingsI18n } from './i18n';

interface PrivacySectionProps {
  privacy: {
    showOnlineStatus: boolean;
    showProfilePhoto: boolean;
    showLastSeen: boolean;
  };
  onPrivacyChange: (key: string, value: boolean) => void;
  renderHeader: (title: string) => JSX.Element;
}

export function PrivacySection({ privacy, onPrivacyChange, renderHeader }: PrivacySectionProps) {
  const { t } = useSettingsI18n();

  return (
    <div className="flex h-full flex-col">
      {renderHeader(t('settings.section.privacy'))}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
        <SectionLabel text={t('settings.privacy.group')} />
        <ToggleRow
          label={t('settings.privacy.online')}
          description={t('settings.privacy.onlineDesc')}
          checked={privacy.showOnlineStatus}
          onChange={(value) => onPrivacyChange('showOnlineStatus', value)}
        />
        <div className="ml-5 h-px bg-gray-100 dark:bg-[#202c33]" />
        <ToggleRow
          label={t('settings.privacy.lastSeen')}
          description={t('settings.privacy.lastSeenDesc')}
          checked={privacy.showLastSeen}
          onChange={(value) => onPrivacyChange('showLastSeen', value)}
        />
        <div className="ml-5 h-px bg-gray-100 dark:bg-[#202c33]" />
        <ToggleRow
          label={t('settings.privacy.photo')}
          description={t('settings.privacy.photoDesc')}
          checked={privacy.showProfilePhoto}
          onChange={(value) => onPrivacyChange('showProfilePhoto', value)}
        />
      </div>
    </div>
  );
}
