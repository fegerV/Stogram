import React, { useState, useEffect } from 'react';
import { Archive, X, MessageSquare } from 'lucide-react';
import axios from 'axios';

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
    loadArchivedChats();
  }, []);

  const loadArchivedChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/chat-settings/archived/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(response.data.chats);
    } catch (error) {
      console.error('Failed to load archived chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/chat-settings/${chatId}/unarchive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(chats.filter(c => c.id !== chatId));
    } catch (error) {
      console.error('Failed to unarchive chat:', error);
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.name) return chat.name;
    if (chat.type === 'PRIVATE') {
      const otherMember = chat.members.find(m => m.user.id !== localStorage.getItem('userId'));
      return otherMember?.user.displayName || otherMember?.user.username || 'Пользователь';
    }
    return 'Чат';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Архивированные чаты
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <Archive className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-center">Нет архивированных чатов</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {chats.map(chat => (
                <div
                  key={chat.id}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  onClick={() => {
                    onSelectChat(chat.id);
                    handleUnarchive(chat.id, {} as any);
                  }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {chat.avatar ? (
                      <img src={chat.avatar} alt={getChatName(chat)} className="w-full h-full rounded-full" />
                    ) : (
                      <MessageSquare className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {getChatName(chat)}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {chat.type === 'GROUP' ? `${chat.members.length} участников` : 'Личный чат'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleUnarchive(chat.id, e)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    title="Разархивировать"
                  >
                    <Archive className="w-5 h-5" />
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
