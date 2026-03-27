import { Chat, ChatType, Message, MessageType } from '../../types';

export function getChatSubtitle(chat: Chat) {
  if (chat.type === ChatType.PRIVATE) {
    return 'личный чат';
  }

  if (chat.type === ChatType.GROUP) {
    return `${chat.members.length} участников`;
  }

  return 'канал';
}

export function getRenderableMessageType(message: Message, fileUrl: string | null) {
  let messageType: MessageType = message.type;

  if (fileUrl && (!messageType || messageType === MessageType.FILE)) {
    const fileName = message.fileName || message.fileUrl || '';
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      messageType = MessageType.IMAGE;
    } else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension || '')) {
      messageType = MessageType.VIDEO;
    } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension || '')) {
      messageType = MessageType.AUDIO;
    }
  }

  return messageType;
}
