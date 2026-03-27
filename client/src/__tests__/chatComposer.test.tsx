import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useChatComposer } from '../components/chat-window/useChatComposer';
import { ChatType, MessageType } from '../types';

vi.mock('../services/socket', () => ({
  socketService: {
    typing: vi.fn(),
  },
}));

describe('useChatComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('consumes pending quick call for the current private chat', async () => {
    const onStartCall = vi.fn();

    sessionStorage.setItem(
      'stogram-pending-call-request',
      JSON.stringify({
        chatId: 'chat-1',
        type: 'VIDEO',
        createdAt: Date.now(),
      }),
    );

    renderHook(() =>
      useChatComposer({
        chatId: 'chat-1',
        currentChat: {
          id: 'chat-1',
          type: ChatType.PRIVATE,
        } as any,
        sendMessage: vi.fn(),
        onStartCall,
      }),
    );

    await waitFor(() => {
      expect(onStartCall).toHaveBeenCalledWith('VIDEO');
    });

    expect(sessionStorage.getItem('stogram-pending-call-request')).toBeNull();
  });

  it('sends media file with inferred message type', async () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useChatComposer({
        chatId: 'chat-1',
        currentChat: {
          id: 'chat-1',
          type: ChatType.PRIVATE,
        } as any,
        sendMessage,
        onStartCall: vi.fn(),
      }),
    );

    const file = new File(['image'], 'photo.png', { type: 'image/png' });

    await act(async () => {
      result.current.handleFileSelect({
        target: { files: [file] },
      } as any);
    });

    expect(sendMessage).toHaveBeenCalledWith('chat-1', '', file, MessageType.IMAGE);
  });
});
