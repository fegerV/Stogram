import { useState, useMemo } from 'react';
import { Search, Edit3, Menu as MenuIcon, Users, Pin } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { getChatName, getChatAvatar, formatMessageTime, getInitials } from '../utils/helpers';
import NewChatModal from './NewChatModal';
import SideDrawer from './SideDrawer';
import { LazyUserSettings } from './LazyComponents';
import { ChatType } from '../types';

type ChatFilter = 'all' | 'private' | 'groups' | 'bots';

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  selectedChatId: string | null;
}

/**
 * Telegram-style chat list with hamburger menu, search, tabs, and FAB.
 */
export default function ChatList({ onSelectChat, selectedChatId }: ChatListProps) {
  const { chats } = useChatStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');

  /** Apply search + tab filter to chats */
  const filteredChats = useMemo(() => {
    let result = chats;

    // Tab filter
    if (activeFilter === 'private') {
      result = result.filter((chat) => chat.type === ChatType.PRIVATE);
    } else if (activeFilter === 'groups') {
      result = result.filter((chat) => chat.type === ChatType.GROUP || chat.type === ChatType.CHANNEL);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((chat) => {
        const chatName = getChatName(chat, user?.id || '');
        return chatName.toLowerCase().includes(query);
      });
    }

    return result;
  }, [chats, activeFilter, searchQuery, user?.id]);

  /** Count unread for each tab (placeholder — real logic would need unread data) */
  const tabCounts = useMemo(() => {
    const all = chats.length;
    const privateCount = chats.filter((c) => c.type === ChatType.PRIVATE).length;
    const groupCount = chats.filter((c) => c.type === ChatType.GROUP || c.type === ChatType.CHANNEL).length;
    return { all, private: privateCount, groups: groupCount, bots: 0 };
  }, [chats]);

  const filters: { id: ChatFilter; label: string; count?: number }[] = [
    { id: 'all', label: 'Все', count: tabCounts.all > 0 ? tabCounts.all : undefined },
    { id: 'private', label: 'Личные', count: tabCounts.private > 0 ? tabCounts.private : undefined },
    { id: 'groups', label: 'Группы', count: tabCounts.groups > 0 ? tabCounts.groups : undefined },
    { id: 'bots', label: 'Боты', count: tabCounts.bots > 0 ? tabCounts.bots : undefined },
  ];

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-[#0b141a]">
      {/* ── Header ── */}
      <div className="bg-[#517da2] dark:bg-[#17212b] text-white">
        {/* Top Row: Hamburger / Title / Search */}
        <div className="flex items-center h-14 px-2">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2.5 hover:bg-white/10 rounded-full transition"
            aria-label="Открыть меню"
          >
            <MenuIcon className="w-[22px] h-[22px]" />
          </button>

          {isSearchOpen ? (
            <div className="flex-1 mx-2">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск..."
                className="w-full bg-transparent text-white placeholder-white/60 text-[16px] focus:outline-none py-1"
                onBlur={() => {
                  if (!searchQuery) setIsSearchOpen(false);
                }}
              />
            </div>
          ) : (
            <h1 className="flex-1 text-[19px] font-semibold ml-3 tracking-tight">
              Stogram
            </h1>
          )}

          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2.5 hover:bg-white/10 rounded-full transition"
            aria-label="Поиск"
          >
            <Search className="w-[22px] h-[22px]" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex overflow-x-auto scrollbar-none border-t border-white/10">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors relative ${
                activeFilter === filter.id
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <span>{filter.label}</span>
              {filter.count !== undefined && filter.count > 0 && (
                <span
                  className={`min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold flex items-center justify-center ${
                    activeFilter === filter.id
                      ? 'bg-white text-[#517da2] dark:text-[#17212b]'
                      : 'bg-white/30 text-white'
                  }`}
                >
                  {filter.count}
                </span>
              )}
              {/* Active indicator line */}
              {activeFilter === filter.id && (
                <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-white rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat List ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin bg-white dark:bg-[#0b141a]">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-2">
            <Search className="w-10 h-10 opacity-40" />
            <p className="text-sm">Чаты не найдены</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const chatName = getChatName(chat, user?.id || '');
            const chatAvatar = getChatAvatar(chat, user?.id || '');
            const lastMessage = chat.messages?.[0];
            const isSelected = chat.id === selectedChatId;

            // Message preview
            let previewText = '';
            let previewSender = '';
            if (lastMessage) {
              if (lastMessage.type === 'IMAGE') {
                previewText = '📷 Фото';
              } else if (lastMessage.type === 'VIDEO') {
                previewText = '🎥 Видео';
              } else if (lastMessage.type === 'AUDIO' || lastMessage.type === 'VOICE') {
                previewText = '🎤 Аудио';
              } else if (lastMessage.type === 'FILE') {
                previewText = '📎 ' + (lastMessage.fileName || 'Файл');
              } else {
                previewText = lastMessage.content || '';
              }
              if (chat.type !== 'PRIVATE' && lastMessage.sender) {
                previewSender = (lastMessage.sender.displayName || lastMessage.sender.username) + ': ';
              }
            }

            return (
              <div
                key={chat.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectChat(chat.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectChat(chat.id);
                }}
                className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#419fd9] dark:bg-[#2b5278]'
                    : 'hover:bg-[#f4f4f5] dark:hover:bg-[#202c33] active:bg-[#e5e5e6] dark:active:bg-[#2a3942]'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {chatAvatar ? (
                    <img
                      src={chatAvatar}
                      alt={chatName}
                      className="w-[54px] h-[54px] rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-[54px] h-[54px] rounded-full flex items-center justify-center text-white font-medium text-base ${
                        chat.type === 'GROUP'
                          ? 'bg-[#4fae4e]'
                          : 'bg-[#3390ec]'
                      }`}
                    >
                      {chat.type === 'GROUP' ? (
                        <Users className="w-6 h-6" />
                      ) : (
                        getInitials(chatName)
                      )}
                    </div>
                  )}
                  {/* Online indicator */}
                  {chat.type === 'PRIVATE' && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#4fae4e] rounded-full border-[2.5px] border-white dark:border-[#0b141a]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 border-b border-gray-100 dark:border-[#202c33] py-1.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <h3
                        className={`font-semibold text-[15px] truncate ${
                          isSelected
                            ? 'text-white'
                            : 'text-[#222222] dark:text-[#e1e1e1]'
                        }`}
                      >
                        {chatName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {lastMessage && (
                        <span
                          className={`text-[12px] ${
                            isSelected
                              ? 'text-white/80'
                              : 'text-[#8e8e93] dark:text-[#6c7883]'
                          }`}
                        >
                          {formatMessageTime(lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {lastMessage && (
                    <div className="flex items-center gap-1">
                      <p
                        className={`text-[14px] truncate flex-1 ${
                          isSelected
                            ? 'text-white/80'
                            : 'text-[#8e8e93] dark:text-[#6c7883]'
                        }`}
                      >
                        {previewSender && (
                          <span
                            className={
                              isSelected
                                ? 'text-white/90 font-medium'
                                : 'text-[#3390ec] dark:text-[#6ab3f3] font-medium'
                            }
                          >
                            {previewSender}
                          </span>
                        )}
                        {previewText}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── FAB (New Chat) ── */}
      <button
        onClick={() => setShowNewChatModal(true)}
        className="absolute bottom-5 right-5 w-[56px] h-[56px] bg-[#3390ec] dark:bg-[#3390ec] text-white rounded-full shadow-lg hover:bg-[#2b7fd4] dark:hover:bg-[#2b7fd4] transition flex items-center justify-center z-10 active:scale-95"
        title="Новое сообщение"
      >
        <Edit3 className="w-6 h-6" />
      </button>

      {/* ── Side Drawer ── */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenSettings={() => setShowSettings(true)}
        onCreateGroup={() => setShowNewChatModal(true)}
        onOpenContacts={() => {}}
      />

      {/* ── Modals ── */}
      {showNewChatModal && (
        <NewChatModal onClose={() => setShowNewChatModal(false)} />
      )}

      {showSettings && (
        <LazyUserSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
