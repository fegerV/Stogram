import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { handleControllerError, handleNotFound, handleForbidden } from '../utils/errorHandlers';
import { assertCanSendMessage, checkChatMembership } from '../utils/permissions';
import { basicUserSelect } from '../utils/userSelect';
import { io } from '../index';
import n8nService from '../services/n8nService';
import internalBotRuntimeService from '../services/internalBotRuntimeService';
import { attachLinkPreview, sendChatMessage } from '../services/messageLifecycleService';
import { incrementUnreadForChatMembers, markChatReadThroughMessage } from '../services/chatReadStateService';

const sendMessageSchema = z.object({
  content: z.string().optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'VOICE', 'GIF']).default('TEXT'),
  replyToId: z.string().optional(),
  scheduledFor: z.string().optional(),
  expiresIn: z.preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return Number(value);
  }, z.number().int().positive().optional()),
  isSilent: z.preprocess((value) => value === true || value === 'true', z.boolean().optional()),
  clientMessageId: z.string().max(128).optional(),
});

const forwardMessageSchema = z.object({
  chatIds: z.array(z.string()).min(1),
});

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId!;
    const { limit = 50, before } = req.query;
    const normalizedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

    const isMember = await checkChatMembership(chatId, userId);

    if (!isMember) {
      return handleForbidden(res, 'Not a member of this chat');
    }

    const where: any = {
      chatId,
      isDeleted: false,
    };

    if (before) {
      where.createdAt = { lt: new Date(before as string) };
    }

    const messages = await prisma.message.findMany({
      where,
      take: normalizedLimit,
      orderBy: { createdAt: 'desc' },
      include: {
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
        reads: {
          select: {
            userId: true,
            readAt: true,
          },
        },
      },
    });

    // Mark messages as read (batch)
    const messageIds = messages.map((m) => m.id);
    if (messageIds.length > 0) {
      const existingReads = await prisma.messageRead.findMany({
        where: {
          messageId: { in: messageIds },
          userId,
        },
        select: { messageId: true },
      });
      
      const existingMessageIds = new Set(existingReads.map((r) => r.messageId));
      const newReads = messageIds
        .filter((id) => !existingMessageIds.has(id))
        .map((messageId) => ({
          messageId,
          userId,
        }));

      if (newReads.length > 0) {
        await (prisma.messageRead.createMany as any)({
          data: newReads,
          skipDuplicates: true,
        });

        // Emit read receipts
        newReads.forEach(({ messageId }) => {
          io.to(`chat:${chatId}`).emit('message:read', { messageId, userId });
        });
      }

      const latestFetchedMessage = messages[0];
      const unreadUpdate = await markChatReadThroughMessage(chatId, userId, latestFetchedMessage.id);
      if (unreadUpdate) {
        io.to(`user:${userId}`).emit('chat:unread-updated', unreadUpdate);
      }
    }

    res.json(messages.reverse());
  } catch (error) {
    handleControllerError(error, res, 'Failed to fetch messages');
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId!;
    const data = sendMessageSchema.parse(req.body);

    const { message, isDuplicate, links, unreadUpdates } = await sendChatMessage({
      chatId,
      senderId: userId,
      content: data.content,
      type: data.type,
      replyToId: data.replyToId,
      scheduledFor: data.scheduledFor,
      expiresIn: data.expiresIn,
      isSilent: data.isSilent,
      clientMessageId: data.clientMessageId,
      file: req.file,
    });

    if (!isDuplicate) {
      io.to(`chat:${chatId}`).emit('message:new', message);
      unreadUpdates.forEach((update) => {
        io.to(`user:${update.userId}`).emit('chat:unread-updated', update);
      });

      n8nService.deliverWebhookEvent('new_message', {
        messageId: message.id,
        chatId,
        senderId: userId,
        content: data.content,
        type: message.type,
        timestamp: message.createdAt.toISOString(),
      }).catch(console.error);

      internalBotRuntimeService.dispatchChatMessageEvent(message.id, 'message.created').catch(console.error);
    }

    if (links.length > 0) {
      attachLinkPreview(message.id, chatId, links[0], (updatedMessage) => {
        io.to(`chat:${chatId}`).emit('message:update', updatedMessage);
      })
        .catch(console.error);
    }

    res.status(isDuplicate ? 200 : 201).json(message);
  } catch (error) {
    handleControllerError(error, res, 'Failed to send message');
  }
};

export const forwardMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId!;
    const { chatIds } = forwardMessageSchema.parse(req.body);

    // Get original message
    const originalMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        bot: true,
        sender: {
          select: basicUserSelect,
        },
        chat: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!originalMessage) {
      return handleNotFound(res, 'Message');
    }

    // Check if user has access to original message
    const hasAccess = originalMessage.chat.members.some(
      (m: { userId: string }) => m.userId === userId
    );

    if (!hasAccess) {
      return handleForbidden(res, 'Access denied to original message');
    }

    // Verify user can send to all target chats, including channel role rules.
    for (const targetChatId of chatIds) {
      await assertCanSendMessage(targetChatId, userId);
    }

    // Forward message to all target chats
    const forwardedMessages = [];
    for (const targetChatId of chatIds) {
      const forwardedMessage = await prisma.message.create({
        data: {
          content: originalMessage.content,
          type: originalMessage.type,
          senderId: userId,
          chatId: targetChatId,
          fileUrl: originalMessage.fileUrl,
          fileName: originalMessage.fileName,
          fileSize: originalMessage.fileSize,
          thumbnailUrl: originalMessage.thumbnailUrl,
          duration: originalMessage.duration,
          waveform: originalMessage.waveform,
          isForwarded: true,
          forwardedFromId: originalMessage.id,
          forwardedFromChatId: originalMessage.chatId,
          forwardedFromUserId: originalMessage.senderId,
          isSent: true,
        },
        include: {
          bot: true,
          sender: {
            select: basicUserSelect,
          },
        },
      });

      await prisma.chat.update({
        where: { id: targetChatId },
        data: { updatedAt: new Date() },
      });

      // Emit to chat participants
      io.to(`chat:${targetChatId}`).emit('message:new', forwardedMessage);
      const unreadUpdates = await incrementUnreadForChatMembers(targetChatId, userId);
      unreadUpdates.forEach((update) => {
        io.to(`user:${update.userId}`).emit('chat:unread-updated', update);
      });

      forwardedMessages.push(forwardedMessage);
    }

    res.json({ messages: forwardedMessages });
  } catch (error) {
    handleControllerError(error, res, 'Failed to forward message');
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId!;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!message) {
      return handleNotFound(res, 'Message');
    }

    // Check if user is member of the chat
    const isMember = message.chat.members.some(
      (m: { userId: string }) => m.userId === userId
    );

    if (!isMember) {
      return handleForbidden(res, 'Not a member of this chat');
    }

    const unreadUpdate = await markChatReadThroughMessage(message.chatId, userId, messageId);
    io.to(`chat:${message.chatId}`).emit('message:read', { messageId, userId });
    if (unreadUpdate) {
      io.to(`user:${userId}`).emit('chat:unread-updated', unreadUpdate);
    }

    res.json({ success: true });
  } catch (error) {
    handleControllerError(error, res, 'Failed to mark message as read');
  }
};

export const editMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId!;
    const { content } = req.body;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return handleNotFound(res, 'Message');
    }

    if (message.senderId !== userId) {
      return handleForbidden(res);
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content, isEdited: true },
      include: {
        bot: true,
        sender: {
          select: basicUserSelect,
        },
      },
    });

    // Emit update
    io.to(`chat:${message.chatId}`).emit('message:update', updatedMessage);

    // Send n8n webhook event (async, don't wait)
    n8nService.deliverWebhookEvent('message_updated', {
      messageId,
      chatId: message.chatId,
      userId,
      newContent: content,
      timestamp: new Date().toISOString(),
    }).catch(console.error);

    internalBotRuntimeService.dispatchChatMessageEvent(messageId, 'message.updated').catch(console.error);

    res.json(updatedMessage);
  } catch (error) {
    handleControllerError(error, res, 'Failed to edit message');
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId!;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return handleNotFound(res, 'Message');
    }

    if (message.senderId !== userId) {
      return handleForbidden(res);
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, content: 'Message deleted' },
    });

    // Emit deletion
    io.to(`chat:${message.chatId}`).emit('message:delete', { messageId });

    // Send n8n webhook event (async, don't wait)
    n8nService.deliverWebhookEvent('message_deleted', {
      messageId,
      chatId: message.chatId,
      userId,
      timestamp: new Date().toISOString(),
    }).catch(console.error);

    internalBotRuntimeService.dispatchChatMessageEvent(messageId, 'message.deleted').catch(console.error);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    handleControllerError(error, res, 'Failed to delete message');
  }
};
