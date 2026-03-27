import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import toast from 'react-hot-toast';
import { useChatWindowData } from '../components/chat-window/useChatWindowData';
import { NotificationLevel } from '../types';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../services/api', () => ({
  chatApi: {
    pinMessage: vi.fn().mockResolvedValue(undefined),
    unpinMessage: vi.fn().mockResolvedValue(undefined),
  },
  chatSettingsApi: {
    get: vi.fn().mockResolvedValue({
      data: {
        settings: {
          notificationLevel: 'ALL',
          isMuted: false,
          folderId: null,
        },
      },
    }),
    updateNotificationLevel: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../utils/monitoredApi', () => ({
  monitoredApi: {
    get: vi.fn().mockResolvedValue({
      data: {
        folders: [{ id: 'folder-1', name: 'Work', color: '#3390ec' }],
      },
    }),
  },
}));

describe('useChatWindowData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selects the chat and resolves admin state and settings', async () => {
    const selectChat = vi.fn();

    const { result } = renderHook(() =>
      useChatWindowData({
        chatId: 'chat-1',
        currentChat: {
          id: 'chat-1',
          members: [{ userId: 'user-1', role: 'OWNER' }],
        } as any,
        userId: 'user-1',
        selectChat,
      }),
    );

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.folders).toHaveLength(1);
      expect(result.current.chatSettings?.notificationLevel).toBe(NotificationLevel.ALL);
    });

    expect(selectChat).toHaveBeenCalledWith('chat-1');
  });

  it('updates folder state and emits chat-settings-updated event', async () => {
    const listener = vi.fn();
    window.addEventListener('chat-settings-updated', listener as EventListener);

    const { result } = renderHook(() =>
      useChatWindowData({
        chatId: 'chat-1',
        currentChat: {
          id: 'chat-1',
          members: [{ userId: 'user-1', role: 'MEMBER' }],
        } as any,
        userId: 'user-1',
        selectChat: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.chatSettings).not.toBeNull();
    });

    await act(async () => {
      await result.current.handleUpdateFolder('folder-1');
    });

    expect(result.current.chatSettings?.folderId).toBe('folder-1');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalled();

    window.removeEventListener('chat-settings-updated', listener as EventListener);
  });
});
