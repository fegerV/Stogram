import { useState } from 'react';
import toast from 'react-hot-toast';
import { Search, X } from 'lucide-react';
import { userApi } from '../services/api';
import { useChatStore } from '../store/chatStore';
import { User } from '../types';
import { getInitials } from '../utils/helpers';

interface NewChatModalProps {
  onClose: () => void;
  initialChatType?: 'PRIVATE' | 'GROUP';
}

export default function NewChatModal({
  onClose,
  initialChatType = 'PRIVATE',
}: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [chatType, setChatType] = useState<'PRIVATE' | 'GROUP'>(initialChatType);
  const [groupName, setGroupName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { createChat } = useChatStore();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      const response = await userApi.search(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      toast.error('Не удалось выполнить поиск');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleUserSelection = (user: User) => {
    setSelectedUsers((current) =>
      current.find((item) => item.id === user.id)
        ? current.filter((item) => item.id !== user.id)
        : [...current, user],
    );
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Выберите хотя бы одного пользователя');
      return;
    }

    if (chatType === 'GROUP' && !groupName.trim()) {
      toast.error('Укажите название группы');
      return;
    }

    try {
      await createChat(
        chatType,
        selectedUsers.map((user) => user.id),
        chatType === 'GROUP' ? groupName : undefined,
      );
      toast.success(chatType === 'GROUP' ? 'Группа создана' : 'Чат создан');
      onClose();
    } catch (error) {
      toast.error('Не удалось создать чат');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#24323d] dark:bg-[#17212b]">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-[#24323d]">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {chatType === 'GROUP' ? 'Новая группа' : 'Новый чат'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition hover:bg-slate-100 dark:hover:bg-[#202b36]"
          >
            <X className="h-5 w-5 text-slate-500 dark:text-slate-300" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setChatType('PRIVATE')}
              className={`flex-1 rounded-xl py-2 font-semibold transition ${
                chatType === 'PRIVATE'
                  ? 'bg-[#3390ec] text-white'
                  : 'bg-slate-100 text-slate-700 dark:bg-[#202b36] dark:text-slate-300'
              }`}
            >
              Личный
            </button>
            <button
              onClick={() => setChatType('GROUP')}
              className={`flex-1 rounded-xl py-2 font-semibold transition ${
                chatType === 'GROUP'
                  ? 'bg-[#3390ec] text-white'
                  : 'bg-slate-100 text-slate-700 dark:bg-[#202b36] dark:text-slate-300'
              }`}
            >
              Группа
            </button>
          </div>

          {chatType === 'GROUP' && (
            <input
              type="text"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Название группы"
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3390ec] dark:border-[#364450] dark:bg-[#202b36] dark:text-white"
            />
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleSearch();
                }
              }}
              placeholder="Поиск пользователей..."
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3390ec] dark:border-[#364450] dark:bg-[#202b36] dark:text-white"
            />
            <button
              onClick={() => void handleSearch()}
              disabled={isSearching}
              className="rounded-xl bg-[#3390ec] px-4 py-2 text-white transition hover:bg-[#2b7fd1] disabled:opacity-50"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 rounded-full bg-[#3390ec]/10 px-3 py-1 text-[#1d4ed8] dark:text-[#7dc1ff]"
                >
                  <span className="text-sm">{user.displayName || user.username}</span>
                  <button
                    onClick={() => toggleUserSelection(user)}
                    className="rounded-full p-0.5 transition hover:bg-[#3390ec]/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 scrollbar-thin">
          {searchResults.map((user) => {
            const isSelected = selectedUsers.some((item) => item.id === user.id);

            return (
              <div
                key={user.id}
                onClick={() => toggleUserSelection(user)}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition ${
                  isSelected
                    ? 'bg-[#3390ec]/10'
                    : 'hover:bg-slate-50 dark:hover:bg-[#202b36]'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3390ec] font-semibold text-white">
                  {getInitials(user.displayName || user.username)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {user.displayName || user.username}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">@{user.username}</p>
                </div>
                {isSelected && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3390ec] text-white">
                    <span className="text-sm">✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-200 p-4 dark:border-[#24323d]">
          <button
            onClick={() => void handleCreateChat()}
            disabled={selectedUsers.length === 0}
            className="w-full rounded-xl bg-[#3390ec] py-3 font-semibold text-white transition hover:bg-[#2b7fd1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {chatType === 'GROUP' ? 'Создать группу' : 'Создать чат'}
          </button>
        </div>
      </div>
    </div>
  );
}
