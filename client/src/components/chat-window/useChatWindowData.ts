import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Chat, NotificationLevel } from '../../types';
import { chatApi, chatSettingsApi } from '../../services/api';
import { monitoredApi } from '../../utils/monitoredApi';

export interface FolderOption {
  id: string;
  name: string;
  color?: string;
}

type ChatSettingsState = {
  isMuted?: boolean;
  notificationLevel?: NotificationLevel;
  folderId?: string | null;
} | null;

interface UseChatWindowDataParams {
  chatId: string;
  currentChat: Chat | null;
  userId?: string;
  selectChat: (chatId: string) => void;
}

export function useChatWindowData({
  chatId,
  currentChat,
  userId,
  selectChat,
}: UseChatWindowDataParams) {
  const [chatSettings, setChatSettings] = useState<ChatSettingsState>(null);
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    selectChat(chatId);
  }, [chatId, selectChat]);

  useEffect(() => {
    if (!currentChat || !userId) {
      setIsAdmin(false);
      return;
    }

    const member = currentChat.members?.find((chatMember) => chatMember.userId === userId);
    setIsAdmin(member?.role === 'OWNER' || member?.role === 'ADMIN');
  }, [currentChat, userId]);

  useEffect(() => {
    const loadChatSettings = async () => {
      try {
        const response = await chatSettingsApi.get(chatId);
        setChatSettings(response.data.settings);
      } catch (error) {
        console.error('Failed to load chat settings:', error);
      }
    };

    void loadChatSettings();
  }, [chatId]);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const response = await monitoredApi.get('/folders');
        setFolders(response.data.folders || []);
      } catch (error) {
        console.error('Failed to load folders for chat settings:', error);
      }
    };

    void loadFolders();
  }, []);

  const handlePinMessage = async (messageId: string) => {
    try {
      await chatApi.pinMessage(chatId, messageId);
      toast.success('Сообщение закреплено');
    } catch (error) {
      console.error('Failed to pin message:', error);
      toast.error('Не удалось закрепить сообщение');
    }
  };

  const handleUnpinMessage = async () => {
    try {
      await chatApi.unpinMessage(chatId);
      toast.success('Сообщение откреплено');
    } catch (error) {
      console.error('Failed to unpin message:', error);
      toast.error('Не удалось открепить сообщение');
    }
  };

  const handleUpdateNotificationLevel = async (level: NotificationLevel) => {
    try {
      await chatSettingsApi.updateNotificationLevel(chatId, level);
      setChatSettings((prev) => ({ ...prev, notificationLevel: level, isMuted: level === NotificationLevel.MUTED }));
      toast.success('Настройки уведомлений обновлены');
    } catch (error) {
      console.error('Failed to update notification level:', error);
      toast.error('Не удалось обновить настройки уведомлений');
    }
  };

  const handleUpdateFolder = async (folderId: string | null) => {
    try {
      await chatSettingsApi.update(chatId, { folderId: folderId ?? undefined });
      setChatSettings((prev) => ({ ...prev, folderId }));
      window.dispatchEvent(
        new CustomEvent('chat-settings-updated', {
          detail: {
            chatId,
            settings: { ...(chatSettings || {}), folderId },
          },
        }),
      );
      toast.success(folderId ? 'Чат добавлен в папку' : 'Чат убран из папки');
    } catch (error) {
      console.error('Failed to update chat folder:', error);
      toast.error('Не удалось обновить папку чата');
    }
  };

  return {
    chatSettings,
    folders,
    isAdmin,
    handlePinMessage,
    handleUnpinMessage,
    handleUpdateNotificationLevel,
    handleUpdateFolder,
  };
}
