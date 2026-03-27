import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useChatWindowUiState } from '../components/chat-window/useChatWindowUiState';

describe('useChatWindowUiState', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    });
  });

  it('opens profile drawer by default on desktop widths', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1280,
    });

    const { result } = renderHook(() => useChatWindowUiState({ chatId: 'chat-1' }));

    expect(result.current.showChatProfile).toBe(true);
  });

  it('opens forward modal and clears context menu for selected message', () => {
    const { result } = renderHook(() => useChatWindowUiState({ chatId: 'chat-1' }));

    act(() => {
      result.current.setContextMenu({ messageId: 'msg-1', x: 100, y: 120 });
      result.current.handleForwardMessage('msg-1');
    });

    expect(result.current.forwardMessageId).toBe('msg-1');
    expect(result.current.showForwardModal).toBe(true);
    expect(result.current.contextMenu).toBeNull();
  });
});
