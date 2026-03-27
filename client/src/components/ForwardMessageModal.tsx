import { useState } from 'react';
import { Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { messageApi } from '../services/api';
import { useChatStore } from '../store/chatStore';
import { getChatName } from '../utils/helpers';

interface ForwardMessageModalProps {
  messageId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ForwardMessageModal({ messageId, onClose, onSuccess }: ForwardMessageModalProps) {
  const { chats } = useChatStore();
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);

  const filteredChats = chats.filter((chat) => {
    const chatName = getChatName(chat, '');
    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleChat = (chatId: string) => {
    setSelectedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      return next;
    });
  };

  const handleForward = async () => {
    if (selectedChatIds.size === 0) return;

    setIsForwarding(true);
    try {
      await messageApi.forward(messageId, Array.from(selectedChatIds));
      toast.success('Сообщение переслано');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to forward message:', error);
      toast.error('Не удалось переслать сообщение');
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-[30px] border border-slate-200/70 bg-white/95 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Переслать сообщение</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200/70 px-4 py-3 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Поиск чатов"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 focus:border-transparent focus:ring-2 focus:ring-[#3390ec] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredChats.map((chat) => {
            const chatName = getChatName(chat, '');
            const isSelected = selectedChatIds.has(chat.id);
            const chatType =
              chat.type === 'PRIVATE' ? 'Личный чат' : chat.type === 'GROUP' ? 'Группа' : 'Канал';

            return (
              <button
                key={chat.id}
                type="button"
                onClick={() => toggleChat(chat.id)}
                className={`mb-2 w-full rounded-2xl p-3 text-left transition ${
                  isSelected
                    ? 'bg-[#3390ec]/10 ring-1 ring-[#3390ec]/25'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3390ec] text-sm font-medium text-white">
                    {chatName[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-slate-900 dark:text-white">{chatName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{chatType}</p>
                  </div>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3390ec] text-[10px] text-white">
                      ✓
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200/70 px-4 py-3 dark:border-slate-700">
          <span className="text-sm text-slate-500 dark:text-slate-400">Выбрано: {selectedChatIds.size}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleForward}
              disabled={selectedChatIds.size === 0 || isForwarding}
              className="rounded-2xl bg-[#3390ec] px-4 py-2 text-sm text-white transition hover:bg-[#2c83d9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isForwarding ? 'Пересылаем...' : 'Переслать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
