import { Bell, BellOff, BellRing, Volume2, VolumeX, X } from 'lucide-react';
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
  {
    level: 'ALL' as NotificationLevel,
    label: 'Все сообщения',
    icon: BellRing,
    description: 'Получать уведомления о каждом новом сообщении.',
  },
  {
    level: 'MENTIONS' as NotificationLevel,
    label: 'Только упоминания',
    icon: Bell,
    description: 'Уведомления будут приходить только при упоминаниях.',
  },
  {
    level: 'MUTED' as NotificationLevel,
    label: 'Отключены',
    icon: BellOff,
    description: 'Чат будет полностью без уведомлений.',
  },
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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Настройки чата</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200/80 px-4 py-4 dark:border-slate-800">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Чат</h3>
          <p className="font-medium text-slate-900 dark:text-white">{chatName}</p>
        </div>

        <div className="px-4 py-4">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Уведомления
          </h3>

          <div className="space-y-2">
            {notificationOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = notificationLevel === option.level;

              return (
                <button
                  key={option.level}
                  type="button"
                  onClick={() => onUpdateNotificationLevel(option.level)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
                    isSelected
                      ? 'border-[#3390ec]/30 bg-[#3390ec]/10'
                      : 'border-transparent bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className={`mt-0.5 ${isSelected ? 'text-[#3390ec]' : 'text-slate-500 dark:text-slate-400'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isSelected ? 'text-[#3390ec]' : 'text-slate-900 dark:text-white'}`}>
                      {option.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                  </div>
                  {isSelected && <div className="mt-1 h-2 w-2 rounded-full bg-[#3390ec]" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-200/80 px-4 py-4 dark:border-slate-800">
          <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Папка</h3>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onUpdateFolder(null)}
              className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                !selectedFolderId
                  ? 'border-[#3390ec] bg-[#3390ec]/10 text-[#3390ec]'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
              }`}
            >
              Без папки
            </button>

            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => onUpdateFolder(folder.id)}
                className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                  selectedFolderId === folder.id
                    ? 'border-transparent text-white'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                }`}
                style={selectedFolderId === folder.id ? { backgroundColor: folder.color || '#3390ec' } : undefined}
              >
                {folder.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-slate-200/80 px-4 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            {notificationLevel === 'MUTED' ? (
              <>
                <VolumeX className="h-4 w-4" />
                <span>Уведомления для этого чата отключены</span>
              </>
            ) : notificationLevel === 'MENTIONS' ? (
              <>
                <Volume2 className="h-4 w-4" />
                <span>Уведомления будут только при упоминаниях</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" />
                <span>Все уведомления для чата включены</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
