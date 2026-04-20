import { ChatType, Message, MessageType, NotificationLevel } from '../../types';
import ru from '../../i18n/ru';

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
    previewText = ru.chat.preview.photo;
  } else if (lastMessage.type === MessageType.VIDEO) {
    previewText = ru.chat.preview.video;
  } else if (lastMessage.type === MessageType.AUDIO || lastMessage.type === MessageType.VOICE) {
    previewText = ru.chat.preview.audio;
  } else if (lastMessage.type === MessageType.FILE) {
    previewText = lastMessage.fileName || ru.chat.preview.file;
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
