import { SectionLabel, ToggleRow } from './SettingsPrimitives';
import { useSettingsI18n } from './i18n';

interface NotificationsSectionProps {
  notifications: {
    notificationsPush: boolean;
    notificationsEmail: boolean;
    notificationsSound: boolean;
    notificationsVibration: boolean;
  };
  onNotificationChange: (
    key: 'notificationsPush' | 'notificationsEmail' | 'notificationsSound' | 'notificationsVibration',
    value: boolean,
  ) => void;
  renderHeader: (title: string) => JSX.Element;
}

export function NotificationsSection({
  notifications,
  onNotificationChange,
  renderHeader,
}: NotificationsSectionProps) {
  const { t } = useSettingsI18n();

  return (
    <div className="flex h-full flex-col">
      {renderHeader(t('settings.section.notifications'))}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
        <SectionLabel text={t('settings.notifications.group')} />
        <ToggleRow
          label={t('settings.notifications.push')}
          description={t('settings.notifications.pushDesc')}
          checked={notifications.notificationsPush}
          onChange={(value) => onNotificationChange('notificationsPush', value)}
        />
        <div className="ml-5 h-px bg-gray-100 dark:bg-[#202c33]" />
        <ToggleRow
          label={t('settings.notifications.email')}
          checked={notifications.notificationsEmail}
          onChange={(value) => onNotificationChange('notificationsEmail', value)}
        />
        <div className="ml-5 h-px bg-gray-100 dark:bg-[#202c33]" />
        <ToggleRow
          label={t('settings.notifications.sound')}
          description={t('settings.notifications.soundDesc')}
          checked={notifications.notificationsSound}
          onChange={(value) => onNotificationChange('notificationsSound', value)}
        />
        <div className="ml-5 h-px bg-gray-100 dark:bg-[#202c33]" />
        <ToggleRow
          label={t('settings.notifications.vibration')}
          checked={notifications.notificationsVibration}
          onChange={(value) => onNotificationChange('notificationsVibration', value)}
        />
      </div>
    </div>
  );
}
