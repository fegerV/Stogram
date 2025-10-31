import { prisma } from '../index';
import * as crypto from 'crypto';

export interface BotMessageOptions {
  chatId: string;
  content?: string;
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'VOICE' | 'GIF';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  thumbnailUrl?: string;
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

  // Verify the chat exists and bot owner is a member
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      members: {
        some: { userId: bot.ownerId }
      }
    }
  });

  if (!chat) {
    throw new Error('Chat not found or bot owner is not a member');
  }

  // Create the message from the bot owner's account
  // In the future, we could add a botId field to Message model to track bot messages
  const message = await prisma.message.create({
    data: {
      content: content || '',
      type,
      senderId: bot.ownerId,
      chatId,
      fileUrl,
      fileName,
      fileSize,
      thumbnailUrl,
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
      }
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
