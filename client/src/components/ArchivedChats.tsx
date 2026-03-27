import React, { useEffect, useState } from 'react';
import { Archive, MessageSquare, X } from 'lucide-react';
import axios from 'axios';
import { getMediaUrl } from '../utils/helpers';

interface Chat {
  id: string;
  name?: string;
  type: string;
  avatar?: string;
  members: any[];
}

interface ArchivedChatsProps {
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
}

export const ArchivedChats: React.FC<ArchivedChatsProps> = ({ onClose, onSelectChat }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadArchivedChats();
  }, []);

  const loadArchivedChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/chat-settings/archived/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(response.data.chats);
    } catch (error) {
      console.error('Failed to load archived chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/chat-settings/${chatId}/unarchive`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setChats((current) => current.filter((chat) => chat.id !== chatId));
    } catch (error) {
      console.error('Failed to unarchive chat:', error);
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.name) {
      return chat.name;
    }

    if (chat.type === 'PRIVATE') {
      const otherMember = chat.members.find((member) => member.user.id !== localStorage.getItem('userId'));
      return otherMember?.user.displayName || otherMember?.user.username || 'Пользователь';
    }

    return 'Чат';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[600px] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#24323d] dark:bg-[#17212b]">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-[#24323d]">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Архивированные чаты</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 transition hover:bg-slate-100 dark:hover:bg-[#202b36]"
          >
            <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#3390ec]" />
            </div>
          ) : chats.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-slate-500 dark:text-slate-400">
              <Archive className="mb-4 h-16 w-16 opacity-50" />
              <p className="text-center">Нет архивированных чатов</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-[#24323d]">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="flex cursor-pointer items-center gap-3 p-4 transition hover:bg-slate-50 dark:hover:bg-[#202b36]"
                  onClick={() => {
                    onSelectChat(chat.id);
                    void handleUnarchive(chat.id, {} as React.MouseEvent);
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#3390ec] to-violet-500 text-white">
                    {chat.avatar ? (
                      <img
                        src={getMediaUrl(chat.avatar) || ''}
                        alt={getChatName(chat)}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <MessageSquare className="h-6 w-6" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-slate-900 dark:text-white">{getChatName(chat)}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {chat.type === 'GROUP' ? `${chat.members.length} участников` : 'Личный чат'}
                    </p>
                  </div>

                  <button
                    onClick={(event) => void handleUnarchive(chat.id, event)}
                    className="rounded-full p-2 text-[#3390ec] transition hover:bg-[#3390ec]/10"
                    title="Разархивировать"
                  >
                    <Archive className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchivedChats;
