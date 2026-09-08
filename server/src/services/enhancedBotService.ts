import prisma from '../utils/prisma';
import { io } from '../index';
import internalBotRuntimeService from './internalBotRuntimeService';

/**
 * Enhanced Bot System - Telegram-like bot functionality
 * 
 * Features:
 * - Inline keyboard support
 * - Reply keyboard support  
 * - Inline query results
 * - Message entities parsing
 * - Chat actions (typing, upload_photo, etc.)
 * - Bot context management
 */

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface ReplyKeyboardButton {
  text: string;
  request_contact?: boolean;
  request_location?: boolean;
}

export interface ReplyKeyboardMarkup {
  keyboard: ReplyKeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  selective?: boolean;
}

export interface MessageEntity {
  type: 'mention' | 'hashtag' | 'cashtag' | 'bot_command' | 'url' | 'email' | 'phone_number' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'pre' | 'text_link' | 'text_mention';
  offset: number;
  length: number;
  url?: string;
  user?: { id: string; username?: string };
}

export interface BotContext {
  botId: string;
  chatId: string;
  userId: string;
  messageId?: string;
  callbackQueryId?: string;
  inlineQueryId?: string;
}

export const parseMessageEntities = (text: string): MessageEntity[] => {
  const entities: MessageEntity[] = [];
  
  // Parse mentions (@username)
  const mentionRegex = /@(\w+)/g;
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    entities.push({
      type: 'mention',
      offset: match.index,
      length: match[0].length,
    });
  }
  
  // Parse hashtags (#tag)
  const hashtagRegex = /#(\w+)/g;
  while ((match = hashtagRegex.exec(text)) !== null) {
    entities.push({
      type: 'hashtag',
      offset: match.index,
      length: match[0].length,
    });
  }
  
  // Parse commands (/command)
  const commandRegex = /(\/[\w@]+)/g;
  while ((match = commandRegex.exec(text)) !== null) {
    entities.push({
      type: 'bot_command',
      offset: match.index,
      length: match[0].length,
    });
  }
  
  // Parse URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  while ((match = urlRegex.exec(text)) !== null) {
    entities.push({
      type: 'url',
      offset: match.index,
      length: match[0].length,
    });
  }
  
  return entities;
};

export const buildInlineKeyboard = (rows: InlineKeyboardButton[][]): InlineKeyboardMarkup => ({
  inline_keyboard: rows,
});

export const buildReplyKeyboard = (
  rows: string[][],
  options?: { resize?: boolean; oneTime?: boolean }
): ReplyKeyboardMarkup => ({
  keyboard: rows.map(row => row.map(text => ({ text }))),
  resize_keyboard: options?.resize,
  one_time_keyboard: options?.oneTime,
});

export const sendChatAction = async (botId: string, chatId: string, action: string): Promise<boolean> => {
  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    select: { isActive: true; ownerId: true },
  });

  if (!bot?.isActive) return false;

  // Emit chat action to WebSocket clients
  io.to(`chat:${chatId}`).emit('chat:action', {
    botId,
    chatId,
    action, // 'typing', 'upload_photo', 'record_video', 'record_audio', 'upload_document', 'find_location', 'record_video_note', 'choose_sticker'
    timestamp: new Date().toISOString(),
  });

  return true;
};

export const answerCallbackQuery = async (
  botId: string,
  callbackQueryId: string,
  options?: {
    text?: string;
    show_alert?: boolean;
    url?: string;
    cache_time?: number;
  }
): Promise<boolean> => {
  const installation = await prisma.botChatInstallation.findFirst({
    where: { botId, isActive: true },
    include: { chat: true },
  });

  if (!installation) return false;

  // Store callback answer for client polling
  await prisma.botCallbackAnswer.create({
    data: {
      botId,
      callbackQueryId,
      text: options?.text,
      showAlert: options?.show_alert ?? false,
      url: options?.url,
      cacheTime: options?.cache_time ?? 0,
    },
  });

  // Emit to WebSocket
  io.to(`chat:${installation.chatId}`).emit('bot:callback_answer', {
    callbackQueryId,
    text: options?.text,
    showAlert: options?.show_alert,
    url: options?.url,
  });

  return true;
};

export const answerInlineQuery = async (
  botId: string,
  inlineQueryId: string,
  results: Array<{
    type: string;
    id: string;
    title?: string;
    description?: string;
    input_message_content?: any;
    photo_url?: string;
    thumbnail_url?: string;
    document_url?: string;
    audio_url?: string;
    video_url?: string;
    gif_url?: string;
    voice_url?: string;
  }>,
  options?: {
    cache_time?: number;
    is_personal?: boolean;
    next_offset?: string;
    button?: {
      text: string;
      web_app?: { url: string };
      start_parameter?: string;
    };
  }
): Promise<boolean> => {
  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    select: { isActive: true; isInline: true },
  });

  if (!bot?.isActive || !bot.isInline) return false;

  // Store inline query results
  await prisma.botInlineResult.create({
    data: {
      botId,
      inlineQueryId,
      results: results as any,
      cacheTime: options?.cache_time ?? 300,
      isPersonal: options?.is_personal ?? false,
      nextOffset: options?.next_offset,
      button: options?.button as any,
    },
  });

  // Emit to WebSocket for real-time delivery
  io.emit('bot:inline_results', {
    inlineQueryId,
    results,
    cacheTime: options?.cache_time,
    isPersonal: options?.is_personal,
    nextOffset: options?.next_offset,
    button: options?.button,
  });

  return true;
};

export const editMessageText = async (
  botId: string,
  messageId: string,
  newText: string,
  options?: {
    parse_mode?: 'Markdown' | 'HTML';
    entities?: MessageEntity[];
    reply_markup?: InlineKeyboardMarkup;
  }
): Promise<boolean> => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { chat: true },
  });

  if (!message || message.botId !== botId) return false;

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      content: newText,
      linkPreview: options?.parse_mode ? { mode: options.parse_mode } : undefined,
    },
  });

  io.to(`chat:${message.chatId}`).emit('message:edited', {
    messageId,
    content: newText,
    editedAt: updated.updatedAt.toISOString(),
  });

  return true;
};

export const editMessageReplyMarkup = async (
  botId: string,
  messageId: string,
  replyMarkup: InlineKeyboardMarkup
): Promise<boolean> => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { chat: true },
  });

  if (!message || message.botId !== botId) return false;

  await prisma.message.update({
    where: { id: messageId },
    data: {
      linkPreview: { ...(message.linkPreview as any), keyboard: replyMarkup } as any,
    },
  });

  io.to(`chat:${message.chatId}`).emit('message:markup_edited', {
    messageId,
    replyMarkup,
  });

  return true;
};

export const deleteMessage = async (botId: string, messageId: string): Promise<boolean> => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { chat: true },
  });

  if (!message || message.botId !== botId) return false;

  await prisma.message.update({
    where: { id: messageId },
    data: { isDeleted: true },
  });

  io.to(`chat:${message.chatId}`).emit('message:deleted', {
    messageId,
    deletedAt: new Date().toISOString(),
  });

  // Trigger bot runtime event
  await internalBotRuntimeService.dispatchChatMessageEvent(messageId, 'message.deleted');

  return true;
};

export const getChatAdministrators = async (chatId: string): Promise<Array<{ userId: string; role: string }>> => {
  const members = await prisma.chatMember.findMany({
    where: {
      chatId,
      role: { in: ['ADMIN', 'OWNER'] },
    },
    select: {
      userId: true,
      role: true,
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
  });

  return members.map(m => ({
    userId: m.userId,
    role: m.role,
  }));
};

export const getChatMemberCount = async (chatId: string): Promise<number> => {
  return prisma.chatMember.count({
    where: { chatId },
  });
};

export const getChatMember = async (chatId: string, userId: string) => {
  return prisma.chatMember.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      },
    },
  });
};

export const setChatPermissions = async (
  chatId: string,
  permissions: {
    can_send_messages?: boolean;
    can_send_audios?: boolean;
    can_send_documents?: boolean;
    can_send_photos?: boolean;
    can_send_videos?: boolean;
    can_send_video_notes?: boolean;
    can_send_voice_notes?: boolean;
    can_send_polls?: boolean;
    can_send_other_messages?: boolean;
    can_add_web_page_previews?: boolean;
    can_change_info?: boolean;
    can_invite_users?: boolean;
    can_pin_messages?: boolean;
  }
): Promise<boolean> => {
  await prisma.chat.update({
    where: { id: chatId },
    data: {
      permissions: permissions as any,
    },
  });

  io.to(`chat:${chatId}`).emit('chat:permissions_updated', {
    chatId,
    permissions,
  });

  return true;
};

export const kickChatMember = async (
  chatId: string,
  userId: string,
  untilDate?: Date
): Promise<boolean> => {
  const membership = await prisma.chatMember.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
  });

  if (!membership) return false;

  if (untilDate) {
    // Temporary ban - mute until date
    await prisma.chatMember.update({
      where: { id: membership.id },
      data: {
        mutedUntil: untilDate,
      },
    });
  } else {
    // Permanent ban - remove member
    await prisma.chatMember.delete({
      where: { id: membership.id },
    });
  }

  io.to(`chat:${chatId}`).emit('chat:member_kicked', {
    chatId,
    userId,
    untilDate: untilDate?.toISOString(),
  });

  return true;
};

export const unbanChatMember = async (chatId: string, userId: string): Promise<boolean> => {
  const membership = await prisma.chatMember.findFirst({
    where: {
      chatId,
      userId,
      mutedUntil: { not: null },
    },
  });

  if (!membership) return false;

  await prisma.chatMember.update({
    where: { id: membership.id },
    data: {
      mutedUntil: null,
    },
  });

  io.to(`chat:${chatId}`).emit('chat:member_unbanned', {
    chatId,
    userId,
  });

  return true;
};

export const restrictChatMember = async (
  chatId: string,
  userId: string,
  permissions: {
    can_send_messages?: boolean;
    can_send_media?: boolean;
    can_send_polls?: boolean;
    can_send_other_messages?: boolean;
    can_add_web_page_previews?: boolean;
    can_change_info?: boolean;
    can_invite_users?: boolean;
    can_pin_messages?: boolean;
  }
): Promise<boolean> => {
  await prisma.chatMember.updateMany({
    where: {
      chatId,
      userId,
    },
    data: {
      permissions: permissions as any,
    },
  });

  io.to(`chat:${chatId}`).emit('chat:member_restricted', {
    chatId,
    userId,
    permissions,
  });

  return true;
};

export const promoteChatMember = async (
  chatId: string,
  userId: string,
  options: {
    is_anonymous?: boolean;
    can_manage_chat?: boolean;
    can_delete_messages?: boolean;
    can_manage_video_chats?: boolean;
    can_restrict_members?: boolean;
    can_promote_members?: boolean;
    can_change_info?: boolean;
    can_invite_users?: boolean;
    can_post_messages?: boolean;
    can_edit_messages?: boolean;
    can_pin_messages?: boolean;
  }
): Promise<boolean> => {
  await prisma.chatMember.updateMany({
    where: {
      chatId,
      userId,
    },
    data: {
      role: 'ADMIN',
      adminPermissions: options as any,
    },
  });

  io.to(`chat:${chatId}`).emit('chat:member_promoted', {
    chatId,
    userId,
    permissions: options,
  });

  return true;
};

export const exportChatInviteLink = async (chatId: string): Promise<string> => {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
  });

  if (!chat) throw new Error('Chat not found');

  // Generate unique invite link
  const inviteCode = `invite_${chatId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await prisma.chatInviteLink.create({
    data: {
      chatId,
      inviteCode,
      name: 'Generated link',
      expiresAt: null,
      maxUses: null,
      createdBy: 'system', // Should be actual user ID in real implementation
    },
  });

  return `${process.env.APP_URL || 'https://stogram.app'}/join/${inviteCode}`;
};

export const createChatInviteLink = async (
  chatId: string,
  options: {
    name?: string;
    expireDate?: Date;
    memberLimit?: number;
    creates_join_request?: boolean;
  }
): Promise<{ inviteLink: string; inviteCode: string }> => {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
  });

  if (!chat) throw new Error('Chat not found');

  const inviteCode = `invite_${chatId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const link = await prisma.chatInviteLink.create({
    data: {
      chatId,
      inviteCode,
      name: options.name || 'Invite link',
      expiresAt: options.expireDate,
      maxUses: options.memberLimit,
      createsJoinRequest: options.creates_join_request ?? false,
      createdBy: 'system',
    },
  });

  return {
    inviteLink: `${process.env.APP_URL || 'https://stogram.app'}/join/${inviteCode}`,
    inviteCode,
  };
};

export const revokeChatInviteLink = async (chatId: string, inviteCode: string): Promise<boolean> => {
  await prisma.chatInviteLink.updateMany({
    where: {
      chatId,
      inviteCode,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  io.to(`chat:${chatId}`).emit('chat:invite_link_revoked', {
    chatId,
    inviteCode,
  });

  return true;
};
