import { Pin, X } from 'lucide-react';
import { Message } from '../types';

interface PinnedMessageBannerProps {
  message: Message;
  onUnpin?: () => void;
}

export default function PinnedMessageBanner({ message, onUnpin }: PinnedMessageBannerProps) {
  const getMessagePreview = (msg: Message) => {
    if (msg.type === 'IMAGE') return 'Фото';
    if (msg.type === 'VIDEO') return 'Видео';
    if (msg.type === 'AUDIO' || msg.type === 'VOICE') return 'Аудио';
    if (msg.type === 'FILE') return msg.fileName || 'Файл';
    return msg.content || '';
  };

  const senderName = message.sender?.displayName || message.sender?.username || 'Unknown';

  return (
    <div className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(23,36,50,0.9),rgba(19,31,44,0.8))] px-4 py-2.5">
      <div className="flex items-start gap-3">
        <div className="panel-soft mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl">
          <Pin className="h-4 w-4 text-[#8cc6ff]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#84c2ff]">Закреплено</p>
          <p className="truncate text-xs text-[#93abc1]">{senderName}</p>
          <p className="truncate text-sm text-white">{getMessagePreview(message)}</p>
        </div>
        {onUnpin && (
          <button
            onClick={onUnpin}
            className="panel-soft flex-shrink-0 rounded-full p-1.5 transition hover:bg-white/10"
            title="Открепить"
          >
            <X className="h-4 w-4 text-[#9db7cf]" />
          </button>
        )}
      </div>
    </div>
  );
}
