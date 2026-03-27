import { Archive, FolderOpen, UserX } from 'lucide-react';
import { Divider, MenuRow, SectionLabel, ToggleRow } from './SettingsPrimitives';
import { useSettingsI18n } from './i18n';

interface ChatSettingsSectionProps {
  notifications: {
    notificationsSound: boolean;
    notificationsVibration: boolean;
    notificationsPush: boolean;
  };
  onOpenFolders: () => void;
  onOpenArchivedChats: () => void;
  onOpenBlockedUsers: () => void;
  onNotificationChange: (
    key: 'notificationsSound' | 'notificationsVibration' | 'notificationsPush',
    value: boolean,
  ) => void;
  renderHeader: (title: string) => JSX.Element;
}

export function ChatSettingsSection({
  notifications,
  onOpenFolders,
  onOpenArchivedChats,
  onOpenBlockedUsers,
  onNotificationChange,
  renderHeader,
}: ChatSettingsSectionProps) {
  const { t } = useSettingsI18n();

  return (
    <div className="flex h-full flex-col">
      {renderHeader(t('settings.section.chatSettings'))}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#17212b]">
        <SectionLabel text={t('settings.chat.organization')} />
        <MenuRow
          icon={FolderOpen}
          label={t('settings.chat.folders')}
          subtitle={t('settings.chat.foldersDesc')}
          onClick={onOpenFolders}
          color="text-[#3390ec]"
        />
        <div className="ml-5 h-px bg-gray-100 dark:bg-[#202c33]" />
        <MenuRow
          icon={Archive}
          label={t('settings.chat.archived')}
          subtitle={t('settings.chat.archivedDesc')}
          onClick={onOpenArchivedChats}
          color="text-[#8e8e93]"
        />
        <div className="ml-5 h-px bg-gray-100 dark:bg-[#202c33]" />
        <MenuRow
          icon={UserX}
          label={t('settings.chat.blocked')}
          subtitle={t('settings.chat.blockedDesc')}
          onClick={onOpenBlockedUsers}
          color="text-[#ef5350]"
        />

        <Divider />

        <SectionLabel text={t('settings.chat.quick')} />
        <ToggleRow
          label={t('settings.chat.sound')}
          description={t('settings.chat.soundDesc')}
          checked={notifications.notificationsSound}
          onChange={(value) => onNotificationChange('notificationsSound', value)}
        />
        <div className="ml-5 h-px bg-gray-100 dark:bg-[#202c33]" />
        <ToggleRow
          label={t('settings.chat.vibration')}
          description={t('settings.chat.vibrationDesc')}
          checked={notifications.notificationsVibration}
          onChange={(value) => onNotificationChange('notificationsVibration', value)}
        />
        <div className="ml-5 h-px bg-gray-100 dark:bg-[#202c33]" />
        <ToggleRow
          label={t('settings.chat.push')}
          description={t('settings.chat.pushDesc')}
          checked={notifications.notificationsPush}
          onChange={(value) => onNotificationChange('notificationsPush', value)}
        />
      </div>
    </div>
  );
}
