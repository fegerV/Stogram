import { ChatType, Message, MessageType, NotificationLevel } from '../../types';

interface ChatWithMeta {
  type: ChatType;
  pinnedMessageId?: string | null;
}

interface ChatSettingsMeta {
  isMuted?: boolean;
  notificationLevel?: NotificationLevel;
}

export function getChatPreview(chatType: ChatType, lastMessage?: Message) {
  if (!lastMessage) {
    return { previewText: '', previewSender: '' };
  }

  let previewText = '';
  let previewSender = '';

  if (lastMessage.type === MessageType.IMAGE) {
    previewText = 'Фото';
  } else if (lastMessage.type === MessageType.VIDEO) {
    previewText = 'Видео';
  } else if (lastMessage.type === MessageType.AUDIO || lastMessage.type === MessageType.VOICE) {
    previewText = 'Аудио';
  } else if (lastMessage.type === MessageType.FILE) {
    previewText = lastMessage.fileName || 'Файл';
  } else {
    previewText = lastMessage.content || '';
  }

  if (chatType !== ChatType.PRIVATE && lastMessage.sender) {
    previewSender = `${lastMessage.sender.displayName || lastMessage.sender.username}: `;
  }

  return { previewText, previewSender };
}

export function getChatMetaFlags(chat: ChatWithMeta, settings?: ChatSettingsMeta) {
  const isMuted = settings?.notificationLevel === NotificationLevel.MUTED || settings?.isMuted === true;
  const isPinned = Boolean(chat.pinnedMessageId) && !isMuted;
  return { isMuted, isPinned };
}
