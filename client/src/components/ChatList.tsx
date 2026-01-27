import { useState } from 'react';
import { MessageCircle, Search, Plus, Menu, LogOut, Settings, Users } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { getChatName, getChatAvatar, formatMessageTime, getInitials } from '../utils/helpers';
import NewChatModal from './NewChatModal';
import ThemeToggle from './ThemeToggle';
import { LazyUserSettings } from './LazyComponents';

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
  const [showSettings, setShowSettings] = useState(false);

  const filteredChats = chats.filter((chat) => {
    const chatName = getChatName(chat, user?.id || '');
    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0b141a]">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-[#202c33] bg-[#008069] dark:bg-[#202c33] text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Stogram</h1>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/10 dark:hover:bg-white/10 rounded-full transition"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-700 rounded-lg shadow-xl py-2 z-10">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                  <ThemeToggle />
                </div>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                >
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full pl-9 pr-4 py-2 bg-white/10 dark:bg-[#2a3942] text-white placeholder-white/50 rounded-lg focus:outline-none focus:bg-white/20 dark:focus:bg-[#2a3942] text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin bg-white dark:bg-[#0b141a]">
        {filteredChats.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>No chats found</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const chatName = getChatName(chat, user?.id || '');
            const chatAvatar = getChatAvatar(chat, user?.id || '');
            const lastMessage = chat.messages?.[0];
            const isSelected = chat.id === selectedChatId;
            
            // Определяем превью последнего сообщения
            let previewText = '';
            if (lastMessage) {
              if (lastMessage.type === 'IMAGE') {
                previewText = '📷 Photo';
              } else if (lastMessage.type === 'VIDEO') {
                previewText = '🎥 Video';
              } else if (lastMessage.type === 'AUDIO' || lastMessage.type === 'VOICE') {
                previewText = '🎤 Audio';
              } else if (lastMessage.type === 'FILE') {
                previewText = '📎 ' + (lastMessage.fileName || 'File');
              } else {
                previewText = lastMessage.content || '';
              }
              
              // Для групповых чатов добавляем имя отправителя
              if (chat.type !== 'PRIVATE' && lastMessage.sender) {
                const senderName = lastMessage.sender.displayName || lastMessage.sender.username;
                previewText = `${senderName}: ${previewText}`;
              }
            }

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`px-3 py-2.5 cursor-pointer transition-colors border-b border-gray-100 dark:border-[#202c33] ${
                  isSelected 
                    ? 'bg-[#e9edef] dark:bg-[#202c33]' 
                    : 'hover:bg-gray-50 dark:hover:bg-[#202c33] active:bg-[#e9edef] dark:active:bg-[#2a3942]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    {chatAvatar ? (
                      <img
                        src={chatAvatar}
                        alt={chatName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#3390ec] dark:bg-[#3390ec] flex items-center justify-center text-white font-medium text-sm">
                        {chat.type === 'GROUP' ? (
                          <Users className="w-6 h-6" />
                        ) : (
                          getInitials(chatName)
                        )}
                      </div>
                    )}
                    {/* Статус онлайн для приватных чатов */}
                    {chat.type === 'PRIVATE' && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-[#0b141a]"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-medium text-[#111b21] dark:text-[#e9edef] text-[15px] truncate">
                        {chatName}
                      </h3>
                      {lastMessage && (
                        <span className="text-xs text-[#667781] dark:text-[#8696a0] ml-2 flex-shrink-0">
                          {formatMessageTime(lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {lastMessage && (
                      <div className="flex items-center gap-1">
                        <p className="text-sm text-[#667781] dark:text-[#8696a0] truncate flex-1">
                          {previewText}
                        </p>
                        {/* Индикатор непрочитанных сообщений можно добавить здесь */}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button
        onClick={() => setShowNewChatModal(true)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-[#00a884] dark:bg-[#00a884] text-white rounded-full shadow-lg hover:bg-[#008069] dark:hover:bg-[#008069] transition flex items-center justify-center z-10"
        title="New Chat"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showNewChatModal && (
        <NewChatModal onClose={() => setShowNewChatModal(false)} />
      )}

      {showSettings && (
        <LazyUserSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
