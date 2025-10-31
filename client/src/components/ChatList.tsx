import { useState } from 'react';
import { MessageCircle, Search, Plus, Menu, LogOut, Settings, Users } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { getChatName, getChatAvatar, formatMessageTime, getInitials } from '../utils/helpers';
import NewChatModal from './NewChatModal';
import ThemeToggle from './ThemeToggle';

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  selectedChatId: string | null;
}

export default function ChatList({ onSelectChat, selectedChatId }: ChatListProps) {
  const { chats } = useChatStore();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const filteredChats = chats.filter((chat) => {
    const chatName = getChatName(chat, user?.id || '');
    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-primary-600 dark:bg-gray-800 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Stogram</h1>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-primary-700 dark:hover:bg-gray-700 rounded-full transition"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-700 rounded-lg shadow-xl py-2 z-10">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                  <ThemeToggle />
                </div>
                <button className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-200 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-10 pr-4 py-2 bg-primary-700 dark:bg-gray-700 text-white placeholder-primary-200 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-white dark:focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredChats.map((chat) => {
          const chatName = getChatName(chat, user?.id || '');
          const chatAvatar = getChatAvatar(chat, user?.id || '');
          const lastMessage = chat.messages?.[0];
          const isSelected = chat.id === selectedChatId;

          return (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition ${
                isSelected ? 'bg-primary-50 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-750'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  {chatAvatar ? (
                    <img
                      src={chatAvatar}
                      alt={chatName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-semibold">
                      {chat.type === 'GROUP' ? (
                        <Users className="w-6 h-6" />
                      ) : (
                        getInitials(chatName)
                      )}
                    </div>
                  )}
                  {chat.type === 'PRIVATE' && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{chatName}</h3>
                    {lastMessage && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatMessageTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {lastMessage && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {lastMessage.sender.displayName}: {lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowNewChatModal(true)}
        className="m-4 bg-primary-600 dark:bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        New Chat
      </button>

      {showNewChatModal && (
        <NewChatModal onClose={() => setShowNewChatModal(false)} />
      )}
    </div>
  );
}
