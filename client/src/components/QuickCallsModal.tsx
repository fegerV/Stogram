import { Phone, Video, X } from 'lucide-react';
import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { ChatType } from '../types';
import { getChatAvatar, getChatName, getInitials, getMediaUrl } from '../utils/helpers';

interface QuickCallsModalProps {
  onClose: () => void;
  onOpenChat: (chatId: string) => void;
  onQuickCall: (chatId: string, type: 'AUDIO' | 'VIDEO') => void;
}

export default function QuickCallsModal({ onClose, onOpenChat, onQuickCall }: QuickCallsModalProps) {
  const { chats } = useChatStore();
  const { user } = useAuthStore();

  const privateChats = useMemo(
    () => chats.filter((chat) => chat.type === ChatType.PRIVATE),
    [chats],
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl max-h-[88vh] overflow-hidden rounded-[28px] bg-white dark:bg-[#17212b] shadow-2xl flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#202c33]">
          <div>
            <h2 className="text-[19px] font-semibold text-[#222] dark:text-white">Звонки</h2>
            <p className="text-sm text-[#8e8e93] dark:text-[#6c7883]">Быстрый запуск звонка для личных чатов</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#202b36]">
            <X className="w-5 h-5 text-[#8e8e93]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {privateChats.length === 0 ? (
            <div className="py-12 text-center text-[#8e8e93]">
              <p className="text-[15px]">Нет личных чатов для звонков</p>
              <p className="mt-1 text-[13px]">Создайте личный чат, и он появится в этом списке.</p>
            </div>
          ) : (
            privateChats.map((chat) => {
              const chatName = getChatName(chat, user?.id || '');
              const chatAvatar = getChatAvatar(chat, user?.id || '');

              return (
                <div key={chat.id} className="flex items-center gap-3 rounded-2xl bg-[#f7f8fa] dark:bg-[#202b36] px-4 py-3">
                  {chatAvatar ? (
                    <img src={getMediaUrl(chatAvatar || undefined) ?? undefined} alt={chatName} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#3390ec] flex items-center justify-center text-white font-semibold">
                      {getInitials(chatName)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-[#222] dark:text-[#e1e1e1]">{chatName}</p>
                    <button
                      onClick={() => {
                        onOpenChat(chat.id);
                        onClose();
                      }}
                      className="mt-1 text-[13px] text-[#3390ec] hover:underline"
                    >
                      Открыть чат
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      onQuickCall(chat.id, 'AUDIO');
                      onClose();
                    }}
                    className="rounded-xl bg-[#3390ec] p-3 text-white"
                    aria-label="Аудиозвонок"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      onQuickCall(chat.id, 'VIDEO');
                      onClose();
                    }}
                    className="rounded-xl bg-[#1c9b5f] p-3 text-white"
                    aria-label="Видеозвонок"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
