import { Pin, X } from 'lucide-react';
import { Message } from '../types';

interface PinnedMessageBannerProps {
  message: Message;
  onUnpin?: () => void;
}

export default function PinnedMessageBanner({ message, onUnpin }: PinnedMessageBannerProps) {
  const getMessagePreview = (msg: Message) => {
    if (msg.type === 'IMAGE') return '📷 Фото';
    if (msg.type === 'VIDEO') return '🎥 Видео';
    if (msg.type === 'AUDIO' || msg.type === 'VOICE') return '🎤 Аудио';
    if (msg.type === 'FILE') return '📎 ' + (msg.fileName || 'Файл');
    return msg.content || '';
  };

  const senderName = message.sender?.displayName || message.sender?.username || 'Unknown';

  return (
    <div className="px-4 py-2 bg-[#fff9c4] dark:bg-[#2a3f2a] border-b border-[#e5ddd5] dark:border-[#202c33]">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Pin className="w-4 h-4 text-[#667781] dark:text-[#8696a0]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#3390ec] dark:text-[#6ab3f3]">
            Закреплено
          </p>
          <p className="text-xs text-[#667781] dark:text-[#8696a0] truncate">
            {senderName}
          </p>
          <p className="text-sm text-[#111b21] dark:text-[#e9edef] truncate">
            {getMessagePreview(message)}
          </p>
        </div>
        {onUnpin && (
          <button
            onClick={onUnpin}
            className="flex-shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition"
            title="Открепить"
          >
            <X className="w-4 h-4 text-[#667781] dark:text-[#8696a0]" />
          </button>
        )}
      </div>
    </div>
  );
}
