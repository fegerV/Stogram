import { X, Bell, BellRing, BellOff, Volume2, VolumeX } from 'lucide-react';
import { NotificationLevel } from '../types';

interface FolderOption {
  id: string;
  name: string;
  color?: string;
}

interface ChatSettingsDrawerProps {
  chatId: string;
  chatName: string;
  notificationLevel: NotificationLevel;
  isMuted: boolean;
  folders: FolderOption[];
  selectedFolderId?: string | null;
  onUpdateNotificationLevel: (level: NotificationLevel) => void;
  onUpdateFolder: (folderId: string | null) => void;
  onClose: () => void;
}

const notificationOptions = [
  { level: 'ALL' as NotificationLevel, label: 'Все сообщения', icon: BellRing, description: 'Получать уведомления о всех сообщениях' },
  { level: 'MENTIONS' as NotificationLevel, label: 'Только упоминания', icon: Bell, description: 'Получать уведомления только при упоминаниях' },
  { level: 'MUTED' as NotificationLevel, label: 'Отключены', icon: BellOff, description: 'Не получать уведомления' },
];

export default function ChatSettingsDrawer({
  chatName,
  notificationLevel,
  folders,
  selectedFolderId,
  onUpdateNotificationLevel,
  onUpdateFolder,
  onClose,
}: ChatSettingsDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#0b141a] shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#202c33]">
          <h2 className="text-lg font-semibold text-[#111b21] dark:text-[#e9edef]">
            Настройки чата
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#202c33] rounded-full transition"
          >
            <X className="w-5 h-5 text-[#54656f] dark:text-[#8696a0]" />
          </button>
        </div>

        {/* Chat Info */}
        <div className="px-4 py-4 border-b border-gray-200 dark:border-[#202c33]">
          <h3 className="text-sm font-medium text-[#667781] dark:text-[#8696a0] uppercase tracking-wide mb-2">
            Чат
          </h3>
          <p className="text-[#111b21] dark:text-[#e9edef] font-medium">{chatName}</p>
        </div>

        {/* Notifications Section */}
        <div className="px-4 py-4">
          <h3 className="text-sm font-medium text-[#667781] dark:text-[#8696a0] uppercase tracking-wide mb-4">
            Уведомления
          </h3>
          
          <div className="space-y-2">
            {notificationOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = notificationLevel === option.level;
              
              return (
                <button
                  key={option.level}
                  onClick={() => onUpdateNotificationLevel(option.level)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg transition ${
                    isSelected
                      ? 'bg-[#00a884]/10 dark:bg-[#00a884]/20 border-2 border-[#00a884]'
                      : 'bg-gray-50 dark:bg-[#202c33] border-2 border-transparent hover:bg-gray-100 dark:hover:bg-[#2a3942]'
                  }`}
                >
                  <div className={`flex-shrink-0 mt-0.5 ${isSelected ? 'text-[#00a884]' : 'text-[#54656f] dark:text-[#8696a0]'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${isSelected ? 'text-[#00a884]' : 'text-[#111b21] dark:text-[#e9edef]'}`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-[#667781] dark:text-[#8696a0] mt-0.5">
                      {option.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-[#00a884] rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-4 border-t border-gray-200 dark:border-[#202c33]">
          <h3 className="text-sm font-medium text-[#667781] dark:text-[#8696a0] uppercase tracking-wide mb-4">
            Папка
          </h3>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onUpdateFolder(null)}
              className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                !selectedFolderId
                  ? 'border-[#00a884] bg-[#00a884]/10 text-[#00a884]'
                  : 'border-gray-200 bg-white text-[#54656f] dark:border-[#2a3942] dark:bg-[#202c33] dark:text-[#8696a0]'
              }`}
            >
              Без папки
            </button>

            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => onUpdateFolder(folder.id)}
                className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                  selectedFolderId === folder.id
                    ? 'text-white border-transparent'
                    : 'border-gray-200 bg-white text-[#54656f] dark:border-[#2a3942] dark:bg-[#202c33] dark:text-[#8696a0]'
                }`}
                style={selectedFolderId === folder.id ? { backgroundColor: folder.color || '#3390ec' } : undefined}
              >
                {folder.name}
              </button>
            ))}
          </div>
        </div>

        {/* Current Status */}
        <div className="px-4 py-4 mt-auto border-t border-gray-200 dark:border-[#202c33]">
          <div className="flex items-center gap-3 text-sm text-[#667781] dark:text-[#8696a0]">
            {notificationLevel === 'MUTED' ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Уведомления отключены для этого чата</span>
              </>
            ) : notificationLevel === 'MENTIONS' ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Уведомления только для упоминаний</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Все уведомления включены</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
