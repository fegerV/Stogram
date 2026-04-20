import prisma from '../utils/prisma';

export interface ChatUnreadUpdate {
  userId: string;
  chatId: string;
  unreadCount: number;
  lastReadMessageId: string | null;
}

const countUnreadAfterMessage = async (chatId: string, userId: string, messageId: string | null) => {
  if (!messageId) {
    return prisma.message.count({
      where: {
        chatId,
        senderId: { not: userId },
        isDeleted: false,
      },
    });
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { createdAt: true },
  });

  if (!message) {
    return 0;
  }

  return prisma.message.count({
    where: {
      chatId,
      senderId: { not: userId },
      isDeleted: false,
      createdAt: { gt: message.createdAt },
    },
  });
};

export const incrementUnreadForChatMembers = async (
  chatId: string,
  senderId: string
): Promise<ChatUnreadUpdate[]> => {
  const members = await prisma.chatMember.findMany({
    where: { chatId },
    select: { userId: true },
  });

  const recipients = members.filter((member) => member.userId !== senderId);
  const updates: ChatUnreadUpdate[] = [];

  for (const member of recipients) {
    const settings = await prisma.chatSettings.upsert({
      where: {
        userId_chatId: {
          userId: member.userId,
          chatId,
        },
      },
      update: {
        unreadCount: { increment: 1 },
      },
      create: {
        userId: member.userId,
        chatId,
        unreadCount: 1,
      },
    });

    updates.push({
      userId: member.userId,
      chatId,
      unreadCount: settings.unreadCount,
      lastReadMessageId: settings.lastReadMessageId,
    });
  }

  return updates;
};

export const markChatReadThroughMessage = async (
  chatId: string,
  userId: string,
  messageId: string
): Promise<ChatUnreadUpdate | null> => {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      chatId,
      chat: {
        members: {
          some: { userId },
        },
      },
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  if (!message) {
    return null;
  }

  await prisma.messageRead.upsert({
    where: {
      messageId_userId: {
        messageId,
        userId,
      },
    },
    create: {
      messageId,
      userId,
    },
    update: {},
  });

  const existingSettings = await prisma.chatSettings.findUnique({
    where: {
      userId_chatId: {
        userId,
        chatId,
      },
    },
    select: {
      lastReadMessageId: true,
    },
  });

  if (existingSettings?.lastReadMessageId) {
    const lastRead = await prisma.message.findUnique({
      where: { id: existingSettings.lastReadMessageId },
      select: { createdAt: true },
    });

    if (lastRead && lastRead.createdAt >= message.createdAt) {
      const unreadCount = await countUnreadAfterMessage(chatId, userId, existingSettings.lastReadMessageId);
      return {
        userId,
        chatId,
        unreadCount,
        lastReadMessageId: existingSettings.lastReadMessageId,
      };
    }
  }

  const unreadCount = await countUnreadAfterMessage(chatId, userId, messageId);
  const settings = await prisma.chatSettings.upsert({
    where: {
      userId_chatId: {
        userId,
        chatId,
      },
    },
    update: {
      unreadCount,
      lastReadMessageId: messageId,
    },
    create: {
      userId,
      chatId,
      unreadCount,
      lastReadMessageId: messageId,
    },
  });

  return {
    userId,
    chatId,
    unreadCount: settings.unreadCount,
    lastReadMessageId: settings.lastReadMessageId,
  };
};
