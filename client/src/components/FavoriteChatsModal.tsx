import { useEffect, useMemo, useState } from 'react';
import { Bookmark, MessageCircle, StarOff, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { chatSettingsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { getChatAvatar, getChatName, getInitials, getMediaUrl } from '../utils/helpers';

interface FavoriteChatsModalProps {
  onClose: () => void;
  onOpenChat: (chatId: string) => void;
}

export default function FavoriteChatsModal({ onClose, onOpenChat }: FavoriteChatsModalProps) {
  const { chats } = useChatStore();
  const { user } = useAuthStore();
  const [favoriteChatIds, setFavoriteChatIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true);
      try {
        const settings = await Promise.all(
          chats.map(async (chat) => {
            try {
              const response = await chatSettingsApi.get(chat.id);
              return { chatId: chat.id, isFavorite: response.data.settings?.isFavorite === true };
            } catch (error) {
              console.error(`Failed to load settings for favorite chat ${chat.id}:`, error);
              return { chatId: chat.id, isFavorite: false };
            }
          }),
        );

        setFavoriteChatIds(new Set(settings.filter((item) => item.isFavorite).map((item) => item.chatId)));
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [chats]);

  const favoriteChats = useMemo(
    () => chats.filter((chat) => favoriteChatIds.has(chat.id)),
    [chats, favoriteChatIds],
  );

  const handleRemoveFavorite = async (chatId: string) => {
    try {
      await chatSettingsApi.toggleFavorite(chatId);
      setFavoriteChatIds((prev) => {
        const next = new Set(prev);
        next.delete(chatId);
        return next;
      });
      toast.success('Чат убран из избранного');
    } catch (error) {
      console.error('Failed to remove favorite chat:', error);
      toast.error('Не удалось обновить избранное');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl max-h-[88vh] overflow-hidden rounded-[28px] bg-white dark:bg-[#17212b] shadow-2xl flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#202c33]">
          <div>
            <h2 className="text-[19px] font-semibold text-[#222] dark:text-white">Избранное</h2>
            <p className="text-sm text-[#8e8e93] dark:text-[#6c7883]">Чаты, которые вы отметили как важные</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#202b36]">
            <X className="w-5 h-5 text-[#8e8e93]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#3390ec]" />
            </div>
          ) : favoriteChats.length === 0 ? (
            <div className="py-12 text-center text-[#8e8e93]">
              <Bookmark className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p className="text-[15px]">Пока нет избранных чатов</p>
              <p className="mt-1 text-[13px]">Добавьте чат в избранное из его настроек.</p>
            </div>
          ) : (
            favoriteChats.map((chat) => {
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
                    <p className="text-[13px] text-[#8e8e93]">{chat.type === 'PRIVATE' ? 'Личный чат' : 'Группа или канал'}</p>
                  </div>
                  <button
                    onClick={() => {
                      onOpenChat(chat.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#3390ec] px-3 py-2 text-sm font-medium text-white"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Открыть
                  </button>
                  <button
                    onClick={() => handleRemoveFavorite(chat.id)}
                    className="rounded-xl p-2 text-[#ef5350] hover:bg-red-50 dark:hover:bg-red-900/10"
                    aria-label="Убрать из избранного"
                  >
                    <StarOff className="w-4 h-4" />
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
