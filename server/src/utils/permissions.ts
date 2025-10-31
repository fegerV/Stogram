import { prisma } from '../index';

export const checkChatMembership = async (chatId: string, userId: string): Promise<boolean> => {
  const member = await prisma.chatMember.findFirst({
    where: { chatId, userId },
  });
  return !!member;
};

export const checkChatAdminPermission = async (chatId: string, userId: string): Promise<boolean> => {
  const member = await prisma.chatMember.findFirst({
    where: {
      chatId,
      userId,
      role: { in: ['OWNER', 'ADMIN'] },
    },
  });
  return !!member;
};

export const checkChatOwnership = async (chatId: string, userId: string): Promise<boolean> => {
  const member = await prisma.chatMember.findFirst({
    where: {
      chatId,
      userId,
      role: 'OWNER',
    },
  });
  return !!member;
};

export const checkResourceOwnership = async (
  resourceId: string,
  userId: string,
  model: 'message' | 'bot' | 'webhook'
): Promise<boolean> => {
  let resource;
  
  switch (model) {
    case 'message':
      resource = await prisma.message.findUnique({
        where: { id: resourceId },
        select: { senderId: true },
      });
      return resource?.senderId === userId;
    
    case 'bot':
      resource = await prisma.bot.findUnique({
        where: { id: resourceId },
        select: { ownerId: true },
      });
      return resource?.ownerId === userId;
    
    case 'webhook':
      resource = await prisma.webhook.findUnique({
        where: { id: resourceId },
        select: { bot: { select: { ownerId: true } } },
      });
      return resource?.bot?.ownerId === userId;
    
    default:
      return false;
  }
};
