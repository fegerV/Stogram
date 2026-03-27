import { useEffect, useState } from 'react';
import type { Message } from '../../types';

interface UseChatWindowUiStateParams {
  chatId: string;
}

export function useChatWindowUiState({ chatId }: UseChatWindowUiStateParams) {
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessageId, setForwardMessageId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ messageId: string; x: number; y: number } | null>(null);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showChatProfile, setShowChatProfile] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setShowChatProfile(true);
    }
  }, [chatId]);

  const handleMessageContextMenu = (event: React.MouseEvent, messageId: string) => {
    event.preventDefault();
    setContextMenu({ messageId, x: event.clientX, y: event.clientY });
  };

  const handleForwardMessage = (messageId: string) => {
    setForwardMessageId(messageId);
    setShowForwardModal(true);
    setContextMenu(null);
  };

  const handleSearchSelect = (message: Message) => {
    window.dispatchEvent(
      new CustomEvent('chat-window-focus-message', {
        detail: { messageId: message.id },
      }),
    );
  };

  return {
    showForwardModal,
    setShowForwardModal,
    forwardMessageId,
    setForwardMessageId,
    showSearch,
    setShowSearch,
    contextMenu,
    setContextMenu,
    showChatSettings,
    setShowChatSettings,
    showChatProfile,
    setShowChatProfile,
    handleMessageContextMenu,
    handleForwardMessage,
    handleSearchSelect,
  };
}
