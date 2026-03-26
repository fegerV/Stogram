import prisma from '../utils/prisma';
import * as crypto from 'crypto';

export interface BotMessageOptions {
  chatId: string;
  content?: string;
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'VOICE' | 'GIF';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  linkPreview?: unknown;
}

export const generateBotToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const getBotByToken = async (token: string) => {
  return await prisma.bot.findUnique({
    where: { token },
    include: { commands: true }
  });
};

/**
 * Send a message on behalf of a bot.
 * This creates a bot-sent message that appears in the chat.
 * The message is associated with the bot owner's user account but can be tracked as a bot message.
 */
export const sendBotMessage = async (
  bot: { id: string; ownerId: string; isActive: boolean },
  options: BotMessageOptions
) => {
  if (!bot.isActive) {
    throw new Error('Bot is not active');
  }

  const { chatId, content, type = 'TEXT', fileUrl, fileName, fileSize, thumbnailUrl } = options;
  const { linkPreview } = options;

  const installation = await prisma.botChatInstallation.findFirst({
    where: {
      botId: bot.id,
      chatId,
      isActive: true,
    },
  });

  if (!installation) {
    throw new Error('Bot is not installed in this chat');
  }

  const message = await prisma.message.create({
    data: {
      content: content || '',
      type,
      senderId: bot.ownerId,
      botId: bot.id,
      chatId,
      fileUrl,
      fileName,
      fileSize,
      thumbnailUrl,
      linkPreview: linkPreview as any,
      isSent: true,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        }
      },
      bot: true,
    }
  });

  // Update chat timestamp
  await prisma.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  });

  return message;
};

/**
 * Validate bot permissions for a specific chat
 */
export const validateBotChatAccess = async (botOwnerId: string, chatId: string): Promise<boolean> => {
  const membership = await prisma.chatMember.findFirst({
    where: {
      userId: botOwnerId,
      chatId
    }
  });
  
  return !!membership;
};

export const installBotInChat = async (botId: string, userId: string, chatId: string) => {
  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    select: {
      id: true,
      ownerId: true,
      isActive: true,
    },
  });

  if (!bot) {
    throw new Error('Bot not found');
  }

  if (bot.ownerId !== userId) {
    throw new Error('You can only install your own bots');
  }

  if (!bot.isActive) {
    throw new Error('Bot is not active');
  }

  const membership = await prisma.chatMember.findFirst({
    where: {
      chatId,
      userId,
    },
  });

  if (!membership) {
    throw new Error('You are not a member of this chat');
  }

  return prisma.botChatInstallation.upsert({
    where: {
      botId_chatId: {
        botId,
        chatId,
      },
    },
    update: {
      isActive: true,
      installedBy: userId,
    },
    create: {
      botId,
      chatId,
      installedBy: userId,
      isActive: true,
    },
    include: {
      chat: {
        select: {
          id: true,
          name: true,
          type: true,
          avatar: true,
        },
      },
    },
  });
};

export const uninstallBotFromChat = async (botId: string, userId: string, chatId: string) => {
  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!bot) {
    throw new Error('Bot not found');
  }

  if (bot.ownerId !== userId) {
    throw new Error('You can only manage your own bots');
  }

  const installation = await prisma.botChatInstallation.findUnique({
    where: {
      botId_chatId: {
        botId,
        chatId,
      },
    },
  });

  if (!installation) {
    throw new Error('Bot is not installed in this chat');
  }

  return prisma.botChatInstallation.update({
    where: {
      botId_chatId: {
        botId,
        chatId,
      },
    },
    data: {
      isActive: false,
    },
  });
};

export const getBotInstallations = async (botId: string, userId: string) => {
  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!bot) {
    throw new Error('Bot not found');
  }

  if (bot.ownerId !== userId) {
    throw new Error('You can only view your own bots');
  }

  return prisma.botChatInstallation.findMany({
    where: {
      botId,
      isActive: true,
    },
    include: {
      chat: {
        select: {
          id: true,
          name: true,
          type: true,
          avatar: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
};
