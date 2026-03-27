import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { userApi, chatSettingsApi } from '../../services/api';
import { monitoredApi } from '../../utils/monitoredApi';
import { ChatType, Message, NotificationLevel, User } from '../../types';
import { getChatName } from '../../utils/helpers';

export type ChatFilter = 'all' | 'private' | 'groups' | 'bots';

export interface FolderOption {
  id: string;
  name: string;
  color?: string;
}

interface ChatListChat {
  id: string;
  type: ChatType;
  messages?: Message[];
  pinnedMessageId?: string | null;
  members?: Array<{ userId: string }>;
}

interface UseChatListDataParams {
  chats: ChatListChat[];
  userId?: string;
  createChat: (type: ChatType, memberIds: string[]) => Promise<unknown>;
  onSelectChat: (chatId: string) => void;
}

const PENDING_CALL_REQUEST_KEY = 'stogram-pending-call-request';

export function useChatListData({
  chats,
  userId,
  createChat,
  onSelectChat,
}: UseChatListDataParams) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [chatSettings, setChatSettings] = useState<
    Map<string, { isMuted?: boolean; notificationLevel?: NotificationLevel; folderId?: string | null }>
  >(new Map());

  const filteredChats = useMemo(() => {
    let result = chats;

    if (activeFilter === 'private') {
      result = result.filter((chat) => chat.type === ChatType.PRIVATE);
    } else if (activeFilter === 'groups') {
      result = result.filter((chat) => chat.type === ChatType.GROUP || chat.type === ChatType.CHANNEL);
    }

    if (selectedFolderId) {
      result = result.filter((chat) => chatSettings.get(chat.id)?.folderId === selectedFolderId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((chat) => {
        const chatName = getChatName(chat as never, userId || '');
        return chatName.toLowerCase().includes(query);
      });
    }

    return result;
  }, [activeFilter, chatSettings, chats, searchQuery, selectedFolderId, userId]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const response = await userApi.search(searchQuery);
        setSearchResults(response.data || []);
      } catch (error) {
        console.error('Search users error:', error);
        setSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const loadChatSettings = async () => {
      const settingsMap = new Map<
        string,
        { isMuted?: boolean; notificationLevel?: NotificationLevel; folderId?: string | null }
      >();

      const responses = await Promise.allSettled(
        chats.map(async (chat) => ({
          chatId: chat.id,
          response: await chatSettingsApi.get(chat.id),
        })),
      );

      responses.forEach((result) => {
        if (result.status === 'fulfilled') {
          settingsMap.set(result.value.chatId, result.value.response.data.settings);
          return;
        }

        console.error('Failed to load chat settings:', result.reason);
      });

      setChatSettings(settingsMap);
    };

    if (chats.length > 0) {
      loadChatSettings();
      return;
    }

    setChatSettings(new Map());
  }, [chats]);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const response = await monitoredApi.get('/folders');
        setFolders(response.data.folders || []);
      } catch (error) {
        console.error('Failed to load folders for chat list:', error);
      }
    };

    loadFolders();
  }, []);

  useEffect(() => {
    const handleChatSettingsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        chatId: string;
        settings: { isMuted?: boolean; notificationLevel?: NotificationLevel; folderId?: string | null };
      }>;
      const detail = customEvent.detail;

      if (!detail?.chatId) {
        return;
      }

      setChatSettings((prev) => {
        const next = new Map(prev);
        next.set(detail.chatId, { ...next.get(detail.chatId), ...detail.settings });
        return next;
      });
    };

    window.addEventListener('chat-settings-updated', handleChatSettingsUpdated as EventListener);
    return () => window.removeEventListener('chat-settings-updated', handleChatSettingsUpdated as EventListener);
  }, []);

  const tabCounts = useMemo(() => {
    const all = chats.length;
    const privateCount = chats.filter((chat) => chat.type === ChatType.PRIVATE).length;
    const groupCount = chats.filter((chat) => chat.type === ChatType.GROUP || chat.type === ChatType.CHANNEL).length;
    return { all, private: privateCount, groups: groupCount, bots: 0 };
  }, [chats]);

  const filters: { id: ChatFilter; label: string; count?: number }[] = [
    { id: 'all', label: 'Все', count: tabCounts.all > 0 ? tabCounts.all : undefined },
    { id: 'private', label: 'Личные', count: tabCounts.private > 0 ? tabCounts.private : undefined },
    { id: 'groups', label: 'Группы', count: tabCounts.groups > 0 ? tabCounts.groups : undefined },
    { id: 'bots', label: 'Боты', count: tabCounts.bots > 0 ? tabCounts.bots : undefined },
  ];

  const handleCreateChatWithUser = async (selectedUser: User) => {
    try {
      const existingChat = chats.find((chat) => {
        if (chat.type !== ChatType.PRIVATE) {
          return false;
        }

        return chat.members?.some((member) => member.userId === selectedUser.id);
      });

      if (existingChat) {
        onSelectChat(existingChat.id);
        setSearchQuery('');
        return;
      }

      await createChat(ChatType.PRIVATE, [selectedUser.id]);
      setSearchQuery('');
      toast.success(`Чат с ${selectedUser.displayName || selectedUser.username} создан`);
    } catch (error) {
      console.error('Create chat error:', error);
      toast.error('Ошибка создания чата');
    }
  };

  const handleQuickCall = (chatId: string, type: 'AUDIO' | 'VIDEO') => {
    try {
      sessionStorage.setItem(
        PENDING_CALL_REQUEST_KEY,
        JSON.stringify({ chatId, type, createdAt: Date.now() }),
      );
      onSelectChat(chatId);
    } catch (error) {
      console.error('Failed to queue quick call:', error);
      toast.error('Не удалось начать звонок');
    }
  };

  return {
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
    tabCounts,
    filters,
    handleCreateChatWithUser,
    handleQuickCall,
  };
}
