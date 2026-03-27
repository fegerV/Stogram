import { useEffect, useState } from 'react';
import { MessageCircle, Search, X } from 'lucide-react';
import { searchApi } from '../services/api';
import { Message } from '../types';
import { useChatStore } from '../store/chatStore';
import { formatMessageTime, getChatName } from '../utils/helpers';

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
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);

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
      if (timer) clearTimeout(timer);
    };
  }, [query, chatId]);

  const handleSelectMessage = (message: Message) => {
    onSelectMessage?.(message);
    onClose?.();
  };

  const getChatNameById = (currentChatId: string) => {
    const chat = chats.find((item) => item.id === currentChatId);
    return chat ? getChatName(chat, '') : 'Неизвестный чат';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-slate-200/70 bg-white/95 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex items-center gap-3 border-b border-slate-200/70 px-4 py-3 dark:border-slate-700">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по сообщениям"
            className="flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            autoFocus
          />
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#3390ec]" />
            </div>
          ) : results.length === 0 && query.trim().length >= 2 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400">
              <MessageCircle className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p>Сообщения не найдены</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400">
              <p>Введите минимум 2 символа для поиска</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => handleSelectMessage(message)}
                  className="w-full rounded-2xl p-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#3390ec] text-sm font-medium text-white">
                      {message.sender.displayName?.[0] || message.sender.username[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {message.sender.displayName || message.sender.username}
                          </span>
                          {!chatId && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {getChatNameById(message.chatId)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-200">
                        {message.content ||
                          (message.type === 'IMAGE'
                            ? 'Фото'
                            : message.type === 'VIDEO'
                            ? 'Видео'
                            : message.type === 'FILE'
                            ? 'Файл'
                            : '')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
