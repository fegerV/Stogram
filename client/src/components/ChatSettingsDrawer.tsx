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
      <div className="animate-fade-in absolute inset-0 bg-black/55" onClick={onClose} />

      <div className="animate-sheet-right panel-glass-strong absolute right-0 top-0 flex h-full w-full max-w-md flex-col text-white">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Настройки чата</h2>
            <p className="text-xs text-[#8fa8bf]">Уведомления, папки и быстрые параметры</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="panel-soft rounded-full p-2 text-[#a6bed3] transition hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/8 px-5 py-4">
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[#7f96ab]">Чат</h3>
          <p className="text-base font-medium text-white">{chatName}</p>
        </div>

        <div className="px-5 py-5">
          <h3 className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-[#7f96ab]">Уведомления</h3>

          <div className="space-y-3">
            {notificationOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = notificationLevel === option.level;

              return (
                <button
                  key={option.level}
                  type="button"
                  onClick={() => onUpdateNotificationLevel(option.level)}
                  className={`flex w-full items-start gap-3 rounded-[24px] border p-4 text-left transition ${
                    isSelected
                      ? 'border-[#4ba3ff]/35 bg-[#4ba3ff]/14 shadow-[0_16px_34px_rgba(47,140,255,0.12)]'
                      : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className={`mt-0.5 ${isSelected ? 'text-[#84c2ff]' : 'text-[#9cb4ca]'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isSelected ? 'text-white' : 'text-[#dcebf8]'}`}>{option.label}</p>
                    <p className="mt-1 text-xs leading-5 text-[#8fa8bf]">{option.description}</p>
                  </div>
                  {isSelected && <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#84c2ff]" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/8 px-5 py-5">
          <h3 className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-[#7f96ab]">Папка</h3>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onUpdateFolder(null)}
              className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                !selectedFolderId
                  ? 'border-[#4ba3ff]/30 bg-[#4ba3ff]/14 text-[#9ad0ff]'
                  : 'border-white/8 bg-white/[0.03] text-[#a8bfd4]'
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
                  selectedFolderId === folder.id ? 'border-transparent text-white shadow-[0_12px_24px_rgba(7,17,27,0.22)]' : 'border-white/8 bg-white/[0.03] text-[#a8bfd4]'
                }`}
                style={selectedFolderId === folder.id ? { backgroundColor: folder.color || '#3390ec' } : undefined}
              >
                {folder.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-white/8 px-5 py-4">
          <div className="flex items-center gap-3 text-sm text-[#9cb4ca]">
            {notificationLevel === 'MUTED' ? (
              <>
                <VolumeX className="h-4 w-4 text-[#ff9c9c]" />
                <span>Уведомления для этого чата отключены</span>
              </>
            ) : notificationLevel === 'MENTIONS' ? (
              <>
                <Volume2 className="h-4 w-4 text-[#84c2ff]" />
                <span>Уведомления будут только при упоминаниях</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 text-[#61d394]" />
                <span>Все уведомления для чата включены</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
