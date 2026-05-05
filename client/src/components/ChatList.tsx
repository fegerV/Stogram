import { lazy, Suspense, useMemo, useState } from 'react';
import { Edit3, Search } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import SideDrawer from './SideDrawer';
import { LazyUserSettings } from './LazyComponents';
import DesktopNavRail from './DesktopNavRail';
import { useChatListData } from './chat-list/useChatListData';
import { ChatListHeader } from './chat-list/ChatListHeader';
import { ChatSearchResults } from './chat-list/ChatSearchResults';
import { ChatListItem } from './chat-list/ChatListItem';

const NewChatModal = lazy(() => import('./NewChatModal'));
const ContactsModal = lazy(() => import('./ContactsModal'));
const FavoriteChatsModal = lazy(() => import('./FavoriteChatsModal'));
const QuickCallsModal = lazy(() => import('./QuickCallsModal'));
const InviteFriendsModal = lazy(() => import('./InviteFriendsModal'));

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  selectedChatId: string | null;
}

export default function ChatList({ onSelectChat, selectedChatId }: ChatListProps) {
  const { chats, createChat } = useChatStore();
  const { user } = useAuthStore();

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatInitialType, setNewChatInitialType] = useState<'PRIVATE' | 'GROUP'>('PRIVATE');
  const [showSettings, setShowSettings] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCalls, setShowCalls] = useState(false);
  const [showInviteFriends, setShowInviteFriends] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    selectedFolderId,
    setSelectedFolderId,
    searchResults,
    isSearchingUsers,
    folders,
    chatSettings,
    filteredChats,
    filters,
    handleCreateChatWithUser,
    handleQuickCall,
  } = useChatListData({
    chats,
    userId: user?.id,
    createChat,
    onSelectChat,
  });

  const folderChatCounts = useMemo(() => {
    const counts = new Map<string, number>();

    chats.forEach((chat) => {
      const folderId = chatSettings.get(chat.id)?.folderId;
      if (!folderId) {
        return;
      }
      counts.set(folderId, (counts.get(folderId) ?? 0) + 1);
    });

    return counts;
  }, [chatSettings, chats]);

  const openCreateGroup = () => {
    setNewChatInitialType('GROUP');
    setShowNewChatModal(true);
  };

  const openNewPrivateChat = () => {
    setNewChatInitialType('PRIVATE');
    setShowNewChatModal(true);
  };

  const handleCreateChatFromSearch = async (...args: Parameters<typeof handleCreateChatWithUser>) => {
    await handleCreateChatWithUser(...args);
    setIsSearchOpen(false);
  };

  return (
    <div className="relative flex h-full bg-transparent text-white">
      <DesktopNavRail
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
      />

      <div className="relative flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,rgba(11,20,31,0.9),rgba(10,17,28,0.92))]">
        <ChatListHeader
          isSearchOpen={isSearchOpen}
          searchQuery={searchQuery}
          activeFilter={activeFilter}
          filters={filters}
          folders={folders}
          selectedFolderId={selectedFolderId}
          folderChatCounts={folderChatCounts}
          onOpenMenu={() => setIsDrawerOpen(true)}
          onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
          onSearchChange={setSearchQuery}
          onSearchBlur={() => {
            if (!searchQuery) {
              setIsSearchOpen(false);
            }
          }}
          onFilterChange={setActiveFilter}
          onFolderChange={setSelectedFolderId}
        />

        <div className="flex-1 overflow-y-auto scrollbar-thin bg-[linear-gradient(180deg,rgba(11,20,31,0.46),rgba(10,17,28,0.66))] pb-24">
          <ChatSearchResults
            searchQuery={searchQuery}
            isSearchingUsers={isSearchingUsers}
            searchResults={searchResults}
            onCreateChat={handleCreateChatFromSearch}
          />

          {filteredChats.length === 0 && (!searchQuery.trim() || searchQuery.length < 2) ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-[#7f96ab]">
              <div className="panel-soft flex h-16 w-16 items-center justify-center rounded-[24px]">
                <Search className="h-8 w-8 opacity-60" />
              </div>
              <p className="text-base font-medium text-[#d9e9f8]">Чаты не найдены</p>
              <p className="max-w-xs text-sm leading-6 text-[#8ba4bc]">
                Попробуйте изменить фильтр, откройте другую папку или начните новый диалог.
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                userId={user?.id}
                selected={chat.id === selectedChatId}
                settings={chatSettings.get(chat.id)}
                onSelect={onSelectChat}
              />
            ))
          )}
        </div>

        <button
          onClick={openNewPrivateChat}
          className="absolute bottom-5 right-5 z-10 flex h-[62px] w-[62px] items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#4ba3ff,#2f8cff)] text-white shadow-[0_18px_45px_rgba(47,140,255,0.35)] transition hover:scale-[1.02] hover:brightness-110 active:scale-95"
          title="Новое сообщение"
        >
          <Edit3 className="h-6 w-6" />
        </button>

        <SideDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onOpenSettings={() => setShowSettings(true)}
          onCreateGroup={openCreateGroup}
          onOpenContacts={() => setShowContacts(true)}
          onOpenFavorites={() => setShowFavorites(true)}
          onOpenCalls={() => setShowCalls(true)}
          onInviteFriends={() => setShowInviteFriends(true)}
        />

        <Suspense fallback={null}>
          {showNewChatModal && (
            <NewChatModal
              initialChatType={newChatInitialType}
              onClose={() => {
                setShowNewChatModal(false);
                setNewChatInitialType('PRIVATE');
              }}
            />
          )}

          {showSettings && <LazyUserSettings onClose={() => setShowSettings(false)} />}

          {showContacts && (
            <ContactsModal
              onClose={() => setShowContacts(false)}
              onOpenChat={(chatId) => {
                onSelectChat(chatId);
                setShowContacts(false);
              }}
            />
          )}

          {showFavorites && (
            <FavoriteChatsModal
              onClose={() => setShowFavorites(false)}
              onOpenChat={(chatId) => {
                onSelectChat(chatId);
                setShowFavorites(false);
              }}
            />
          )}

          {showCalls && (
            <QuickCallsModal
              onClose={() => setShowCalls(false)}
              onOpenChat={(chatId) => {
                onSelectChat(chatId);
                setShowCalls(false);
              }}
              onQuickCall={handleQuickCall}
            />
          )}

          {showInviteFriends && <InviteFriendsModal onClose={() => setShowInviteFriends(false)} />}
        </Suspense>
      </div>
    </div>
  );
}
