import { Copy, Send, Share2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface InviteFriendsModalProps {
  onClose: () => void;
}

export default function InviteFriendsModal({ onClose }: InviteFriendsModalProps) {
  const { user } = useAuthStore();
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteLink = `${baseUrl}/register${user?.username ? `?invite=${encodeURIComponent(user.username)}` : ''}`;
  const inviteMessage = `Присоединяйся ко мне в Stogram: ${inviteLink}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Ссылка приглашения скопирована');
    } catch (error) {
      console.error('Failed to copy invite link:', error);
      toast.error('Не удалось скопировать ссылку');
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Приглашение в Stogram',
          text: inviteMessage,
          url: inviteLink,
        });
        return;
      } catch (error) {
        console.error('Share cancelled or failed:', error);
      }
    }

    window.open(`mailto:?subject=${encodeURIComponent('Приглашение в Stogram')}&body=${encodeURIComponent(inviteMessage)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-[28px] bg-white dark:bg-[#17212b] shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#202c33]">
          <div>
            <h2 className="text-[19px] font-semibold text-[#222] dark:text-white">Пригласить друзей</h2>
            <p className="text-sm text-[#8e8e93] dark:text-[#6c7883]">Поделитесь ссылкой на регистрацию в приложении</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#202b36]">
            <X className="w-5 h-5 text-[#8e8e93]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-2xl bg-[#f7f8fa] dark:bg-[#202b36] p-4">
            <p className="text-[13px] text-[#8e8e93] mb-2">Ссылка приглашения</p>
            <p className="break-all text-[15px] text-[#222] dark:text-[#e1e1e1]">{inviteLink}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3390ec] px-4 py-3 text-white font-medium"
            >
              <Copy className="w-4 h-4" />
              Копировать ссылку
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1c9b5f] px-4 py-3 text-white font-medium"
            >
              <Share2 className="w-4 h-4" />
              Поделиться
            </button>
          </div>

          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('Присоединяйся ко мне в Stogram')}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#3390ec]/20 px-4 py-3 text-[#3390ec] font-medium"
          >
            <Send className="w-4 h-4" />
            Отправить через Telegram
          </a>
        </div>
      </div>
    </div>
  );
}
