import { MessageType } from '@prisma/client';
import prisma from '../utils/prisma';
import { processMedia } from './mediaService';
import { sendNewMessageNotification } from './pushService';
import { assertCanSendMessage } from '../utils/permissions';
import { extractHashtags, extractMentions, extractUrls } from '../utils/textParsers';
import { fetchLinkPreview } from '../utils/linkPreview';
import { basicUserSelect } from '../utils/userSelect';
import { ChatUnreadUpdate, incrementUnreadForChatMembers } from './chatReadStateService';

export interface SendChatMessageInput {
  chatId: string;
  senderId: string;
  content?: string;
  type?: MessageType | 'GIF' | 'VOICE';
  replyToId?: string;
  scheduledFor?: string;
  expiresIn?: number;
  isSilent?: boolean;
  clientMessageId?: string;
  file?: Express.Multer.File;
}

export interface SendChatMessageResult {
  message: any;
  isDuplicate: boolean;
  links: string[];
  unreadUpdates: ChatUnreadUpdate[];
}

const includeMessageRelations = {
  bot: true,
  sender: {
    select: basicUserSelect,
  },
  replyTo: {
    include: {
      bot: true,
      sender: {
        select: basicUserSelect,
      },
    },
  },
};

const resolveUploadedMedia = async (file: Express.Multer.File, requestedType?: string) => {
  let fileUrl = `/uploads/${file.filename}`;
  let messageType = requestedType || 'FILE';
  const fileName = file.originalname;
  const fileSize = file.size;
  let thumbnailUrl: string | undefined;
  let duration: number | undefined;
  let waveform: string | undefined;

  if (!requestedType || requestedType === 'FILE') {
    if (file.mimetype.startsWith('image/')) {
      messageType = 'IMAGE';
    } else if (file.mimetype.startsWith('video/')) {
      messageType = 'VIDEO';
    } else if (file.mimetype.startsWith('audio/')) {
      messageType = 'AUDIO';
    }
  }

  try {
    const mediaResult = await processMedia(file.path, file.mimetype);

    if (mediaResult.compressedPath && mediaResult.compressedPath !== mediaResult.originalPath) {
      fileUrl = mediaResult.compressedPath.replace(/^.*\/uploads/, '/uploads');
    }

    if (mediaResult.thumbnailPath) {
      thumbnailUrl = mediaResult.thumbnailPath.replace(/^.*\/uploads/, '/uploads');
    }
    if (mediaResult.duration) {
      duration = mediaResult.duration;
    }
    if (mediaResult.waveform) {
      waveform = mediaResult.waveform;
    }
  } catch (error) {
    console.error('Media processing error:', error);
  }

  return {
    fileUrl,
    fileName,
    fileSize,
    thumbnailUrl,
    duration,
    waveform,
    messageType,
  };
};

export const sendChatMessage = async (input: SendChatMessageInput): Promise<SendChatMessageResult> => {
  await assertCanSendMessage(input.chatId, input.senderId);

  if (input.clientMessageId) {
    const existingMessage = await prisma.message.findFirst({
      where: {
        senderId: input.senderId,
        clientMessageId: input.clientMessageId,
      },
      include: includeMessageRelations,
    });

    if (existingMessage) {
      return {
        message: existingMessage,
        isDuplicate: true,
        links: [],
        unreadUpdates: [],
      };
    }
  }

  const media = input.file
    ? await resolveUploadedMedia(input.file, input.type)
    : {
        fileUrl: undefined,
        fileName: undefined,
        fileSize: undefined,
        thumbnailUrl: undefined,
        duration: undefined,
        waveform: undefined,
        messageType: input.type || 'TEXT',
      };

  const scheduledFor = input.scheduledFor ? new Date(input.scheduledFor) : undefined;
  const isSent = !scheduledFor;
  const expiresAt = input.expiresIn ? new Date(Date.now() + input.expiresIn * 1000) : undefined;
  const links = input.content ? extractUrls(input.content) : [];

  const message = await prisma.message.create({
    data: {
      clientMessageId: input.clientMessageId,
      content: input.content,
      type: media.messageType as MessageType,
      senderId: input.senderId,
      chatId: input.chatId,
      replyToId: input.replyToId,
      fileUrl: media.fileUrl,
      fileName: media.fileName,
      fileSize: media.fileSize,
      thumbnailUrl: media.thumbnailUrl,
      duration: media.duration,
      waveform: media.waveform,
      scheduledFor,
      expiresAt,
      isSent,
      isSilent: input.isSilent || false,
      mentions: input.content ? JSON.stringify(extractMentions(input.content)) : null,
      hashtags: input.content ? JSON.stringify(extractHashtags(input.content)) : null,
      linkPreview: undefined,
    },
    include: includeMessageRelations,
  });

  await prisma.chat.update({
    where: { id: input.chatId },
    data: { updatedAt: new Date() },
  });

  if (isSent && !input.isSilent) {
    const chat = await prisma.chat.findUnique({
      where: { id: input.chatId },
      include: { members: true },
    });
    const sender = await prisma.user.findUnique({
      where: { id: input.senderId },
      select: { displayName: true, username: true },
    });

    if (chat && sender) {
      const senderName = sender.displayName || sender.username;
      chat.members
        .filter((member) => member.userId !== input.senderId)
        .forEach((member) => {
          sendNewMessageNotification(
            member.userId,
            senderName,
            input.content || 'Sent a file',
            input.chatId
          ).catch(console.error);
        });
    }
  }

  const unreadUpdates = isSent
    ? await incrementUnreadForChatMembers(input.chatId, input.senderId)
    : [];

  return {
    message,
    isDuplicate: false,
    links,
    unreadUpdates,
  };
};

export const attachLinkPreview = async (
  messageId: string,
  chatId: string,
  url: string,
  onUpdated: (message: any) => void
) => {
  const preview = await fetchLinkPreview(url);
  if (!preview) {
    return;
  }

  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: { linkPreview: JSON.parse(JSON.stringify(preview)) },
    include: includeMessageRelations,
  });

  onUpdated(updatedMessage);
};
