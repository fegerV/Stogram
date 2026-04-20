import prisma from './prisma';

export type ChatRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type ChatType = 'PRIVATE' | 'GROUP' | 'CHANNEL';

export interface ChatMembership {
  userId: string;
  chatId: string;
  role: ChatRole;
  chat: {
    id: string;
    type: ChatType;
  };
}

const permissionError = (message: string, statusCode = 403) => {
  const error = new Error(message);
  (error as any).statusCode = statusCode;
  return error;
};

export const getChatMembership = async (chatId: string, userId: string): Promise<ChatMembership | null> => {
  return prisma.chatMember.findFirst({
    where: { chatId, userId },
    select: {
      userId: true,
      chatId: true,
      role: true,
      chat: {
        select: {
          id: true,
          type: true,
        },
      },
    },
  }) as Promise<ChatMembership | null>;
};

export const isChatAdminRole = (role: ChatRole) => role === 'OWNER' || role === 'ADMIN';

export const assertChatMember = async (chatId: string, userId: string): Promise<ChatMembership> => {
  const membership = await getChatMembership(chatId, userId);
  if (!membership) {
    throw permissionError('Not a member of this chat');
  }
  return membership;
};

export const assertChatAdmin = async (chatId: string, userId: string): Promise<ChatMembership> => {
  const membership = await assertChatMember(chatId, userId);
  if (!isChatAdminRole(membership.role)) {
    throw permissionError('Only owners and admins can perform this action');
  }
  return membership;
};

export const assertCanSendMessage = async (chatId: string, userId: string): Promise<ChatMembership> => {
  const membership = await assertChatMember(chatId, userId);
  if (membership.chat.type === 'CHANNEL' && !isChatAdminRole(membership.role)) {
    throw permissionError('Only owners and admins can send messages to channels');
  }
  return membership;
};

export const assertCanPinMessage = assertChatAdmin;
export const assertCanManageChatMedia = assertChatAdmin;

export const checkChatMembership = async (chatId: string, userId: string): Promise<boolean> => {
  return Boolean(await getChatMembership(chatId, userId));
};

export const checkChatAdminPermission = async (chatId: string, userId: string): Promise<boolean> => {
  const member = await getChatMembership(chatId, userId);
  return Boolean(member && isChatAdminRole(member.role));
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
