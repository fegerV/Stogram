import { ArrowLeft, Phone, PinOff, Search, Settings, Video } from 'lucide-react';

interface ChatWindowHeaderProps {
  chatName: string;
  chatAvatar: string | null;
  chatSubtitle: string;
  canStartCall: boolean;
  hasPinnedMessage: boolean;
  onBack?: () => void;
  onOpenProfile: () => void;
  onUnpinMessage: () => void;
  onOpenSearch: () => void;
  onStartAudioCall: () => void;
  onStartVideoCall: () => void;
  onOpenSettings: () => void;
  getInitials: (value: string) => string;
}

export function ChatWindowHeader({
  chatName,
  chatAvatar,
  chatSubtitle,
  canStartCall,
  hasPinnedMessage,
  onBack,
  onOpenProfile,
  onUnpinMessage,
  onOpenSearch,
  onStartAudioCall,
  onStartVideoCall,
  onOpenSettings,
  getInitials,
}: ChatWindowHeaderProps) {
  return (
    <div className="border-b border-[#21303d] bg-[#18232e] px-3 py-3 text-white shadow-sm dark:border-[#202c33] dark:bg-[#202c33] md:px-5">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-shrink-0 rounded-full p-1.5 transition hover:bg-white/10 md:hidden"
              title="Назад"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
          )}
          <button
            onClick={onOpenProfile}
            className="flex min-w-0 items-center gap-2 rounded-2xl px-1 py-1 text-left transition hover:bg-white/10 md:gap-3"
            title="Открыть профиль"
          >
            {chatAvatar ? (
              <img src={chatAvatar} alt={chatName} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#3390ec] text-sm font-medium text-white">
                {getInitials(chatName)}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-[16px] font-medium text-white">{chatName}</h2>
              <p className="truncate text-xs text-white/60">{chatSubtitle}</p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-2xl bg-white/5 px-1 py-1">
          {hasPinnedMessage && (
            <button
              onClick={onUnpinMessage}
              className="rounded-full p-2 transition hover:bg-white/10"
              title="Открепить сообщение"
            >
              <PinOff className="h-5 w-5 text-white" />
            </button>
          )}
          <button
            onClick={onOpenSearch}
            className="rounded-full p-2 transition hover:bg-white/10"
            title="Поиск"
          >
            <Search className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={onStartAudioCall}
            disabled={!canStartCall}
            className="rounded-full p-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            title="Аудиозвонок"
          >
            <Phone className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={onStartVideoCall}
            disabled={!canStartCall}
            className="rounded-full p-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            title="Видеозвонок"
          >
            <Video className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={onOpenSettings}
            className="rounded-full p-2 transition hover:bg-white/10"
            title="Настройки чата"
          >
            <Settings className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
