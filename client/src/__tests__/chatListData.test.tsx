import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useChatListData } from '../components/chat-list/useChatListData';
import { ChatType } from '../types';

vi.mock('../services/api', () => ({
  userApi: {
    search: vi.fn().mockResolvedValue({ data: [] }),
  },
  chatSettingsApi: {
    get: vi.fn().mockResolvedValue({
      data: { settings: { notificationLevel: 'ALL', isMuted: false, folderId: null } },
    }),
  },
}));

vi.mock('../utils/monitoredApi', () => ({
  monitoredApi: {
    get: vi.fn().mockResolvedValue({
      data: {
        folders: [{ id: 'folder-work', name: 'Work', color: '#3390ec' }],
      },
    }),
  },
}));

const socketListeners = new Map<string, (...args: any[]) => void>();

vi.mock('../services/socket', () => ({
  socketService: {
    on: vi.fn((event: string, callback: (...args: any[]) => void) => {
      socketListeners.set(event, callback);
    }),
    off: vi.fn((event: string) => {
      socketListeners.delete(event);
    }),
  },
}));

const chats = [
  {
    id: 'chat-1',
    type: ChatType.PRIVATE,
    members: [{ userId: 'user-2' }],
    messages: [],
  },
  {
    id: 'chat-2',
    type: ChatType.GROUP,
    members: [{ userId: 'user-2' }, { userId: 'user-3' }],
    messages: [],
  },
] as any;

describe('useChatListData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socketListeners.clear();
    sessionStorage.clear();
  });

  it('filters chats by active tab', async () => {
    const { result } = renderHook(() =>
      useChatListData({
        chats,
        userId: 'user-1',
        createChat: vi.fn().mockResolvedValue(undefined),
        onSelectChat: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.filters.length).toBeGreaterThan(0);
    });

    expect(result.current.filteredChats).toHaveLength(2);

    act(() => {
      result.current.setActiveFilter('private');
    });
    await waitFor(() => {
      expect(result.current.filteredChats).toHaveLength(1);
      expect(result.current.filteredChats[0].id).toBe('chat-1');
    });

    act(() => {
      result.current.setActiveFilter('groups');
    });
    await waitFor(() => {
      expect(result.current.filteredChats).toHaveLength(1);
      expect(result.current.filteredChats[0].id).toBe('chat-2');
    });
  });

  it('stores quick call request and selects the chat', async () => {
    const onSelectChat = vi.fn();

    const { result } = renderHook(() =>
      useChatListData({
        chats,
        userId: 'user-1',
        createChat: vi.fn().mockResolvedValue(undefined),
        onSelectChat,
      }),
    );

    await waitFor(() => {
      expect(result.current.folders).toHaveLength(1);
      expect(result.current.chatSettings.size).toBe(2);
    });

    act(() => {
      result.current.handleQuickCall('chat-1', 'VIDEO');
    });

    expect(onSelectChat).toHaveBeenCalledWith('chat-1');

    const raw = sessionStorage.getItem('stogram-pending-call-request');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw || '{}')).toMatchObject({
      chatId: 'chat-1',
      type: 'VIDEO',
    });
  });

  it('updates unread counters from socket events', async () => {
    const { result } = renderHook(() =>
      useChatListData({
        chats,
        userId: 'user-1',
        createChat: vi.fn().mockResolvedValue(undefined),
        onSelectChat: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.chatSettings.size).toBe(2);
      expect(socketListeners.has('chat:unread-updated')).toBe(true);
    });

    act(() => {
      socketListeners.get('chat:unread-updated')?.({
        chatId: 'chat-1',
        unreadCount: 3,
        lastReadMessageId: 'message-9',
      });
    });

    expect(result.current.chatSettings.get('chat-1')).toMatchObject({
      unreadCount: 3,
      lastReadMessageId: 'message-9',
    });
  });
});
