import { useState, useEffect } from 'react';
import { Search, X, MessageCircle } from 'lucide-react';
import { searchApi } from '../services/api';
import { Message } from '../types';
import { formatMessageTime, getChatName } from '../utils/helpers';
import { useChatStore } from '../store/chatStore';

interface MessageSearchProps {
  chatId?: string;
  onSelectMessage?: (message: Message) => void;
  onClose?: () => void;
}

export default function MessageSearch({ chatId, onSelectMessage, onClose }: MessageSearchProps) {
  const { chats } = useChatStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchApi.searchMessages(query, chatId);
        setResults(response.data.messages || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    setDebounceTimer(timer);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [query, chatId]);

  const handleSelectMessage = (message: Message) => {
    onSelectMessage?.(message);
    onClose?.();
  };

  const getChatNameById = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    return chat ? getChatName(chat, '') : 'Unknown Chat';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#202c33] rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#202c33] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по сообщениям..."
            className="flex-1 bg-transparent outline-none text-[#111b21] dark:text-[#e9edef] placeholder-[#667781] dark:placeholder-[#8696a0]"
            autoFocus
          />
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-[#2a3942] rounded-full transition"
            >
              <X className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]"></div>
            </div>
          ) : results.length === 0 && query.trim().length >= 2 ? (
            <div className="text-center py-8 text-[#667781] dark:text-[#8696a0]">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Сообщения не найдены</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-[#667781] dark:text-[#8696a0]">
              <p>Введите минимум 2 символа для поиска</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((message) => (
                <div
                  key={message.id}
                  onClick={() => handleSelectMessage(message)}
                  className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a3942] cursor-pointer transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#3390ec] flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                      {message.sender.displayName?.[0] || message.sender.username[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#111b21] dark:text-[#e9edef]">
                            {message.sender.displayName || message.sender.username}
                          </span>
                          {!chatId && (
                            <span className="text-xs text-[#667781] dark:text-[#8696a0]">
                              {getChatNameById(message.chatId)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#667781] dark:text-[#8696a0]">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-[#111b21] dark:text-[#e9edef] line-clamp-2">
                        {message.content || (message.type === 'IMAGE' ? '📷 Фото' : message.type === 'VIDEO' ? '🎥 Видео' : message.type === 'FILE' ? '📎 Файл' : '')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
