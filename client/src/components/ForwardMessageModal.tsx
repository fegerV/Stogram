import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { messageApi } from '../services/api';
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
      const newSet = new Set(prev);
      if (newSet.has(chatId)) {
        newSet.delete(chatId);
      } else {
        newSet.add(chatId);
      }
      return newSet;
    });
  };

  const handleForward = async () => {
    if (selectedChatIds.size === 0) return;

    setIsForwarding(true);
    try {
      await messageApi.forward(messageId, Array.from(selectedChatIds));
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to forward message:', error);
      alert('Ошибка при пересылке сообщения');
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#202c33] rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#202c33] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111b21] dark:text-[#e9edef]">
            Переслать сообщение
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-[#2a3942] rounded-full transition"
          >
            <X className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#202c33]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#667781] dark:text-[#8696a0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск чатов..."
              className="w-full pl-10 pr-4 py-2 bg-[#f0f2f5] dark:bg-[#2a3942] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] text-[#111b21] dark:text-[#e9edef] text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredChats.map((chat) => {
            const chatName = getChatName(chat, '');
            const isSelected = selectedChatIds.has(chat.id);

            return (
              <div
                key={chat.id}
                onClick={() => toggleChat(chat.id)}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-[#d9fdd3] dark:bg-[#005c4b]'
                    : 'hover:bg-gray-50 dark:hover:bg-[#2a3942]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-[#3390ec] flex items-center justify-center text-white font-medium text-sm`}>
                    {chatName[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-[#111b21] dark:text-[#e9edef]">{chatName}</h3>
                    <p className="text-xs text-[#667781] dark:text-[#8696a0]">
                      {chat.type === 'PRIVATE' ? 'Приватный чат' : chat.type === 'GROUP' ? 'Группа' : 'Канал'}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#00a884] flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-[#202c33] flex items-center justify-between gap-3">
          <span className="text-sm text-[#667781] dark:text-[#8696a0]">
            Выбрано: {selectedChatIds.size}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] rounded-lg hover:bg-gray-300 dark:hover:bg-[#3a4a52] transition"
            >
              Отмена
            </button>
            <button
              onClick={handleForward}
              disabled={selectedChatIds.size === 0 || isForwarding}
              className="px-4 py-2 bg-[#00a884] text-white rounded-lg hover:bg-[#008069] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isForwarding ? 'Пересылка...' : 'Переслать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
