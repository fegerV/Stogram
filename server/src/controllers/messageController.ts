import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { processMedia } from '../services/mediaService';
import { sendNewMessageNotification } from '../services/pushService';
import { handleControllerError, handleNotFound, handleForbidden } from '../utils/errorHandlers';
import { checkChatMembership } from '../utils/permissions';
import { extractMentions, extractHashtags, extractUrls } from '../utils/textParsers';
import { fetchLinkPreview } from '../utils/linkPreview';
import { basicUserSelect } from '../utils/userSelect';
import { io } from '../index';

const sendMessageSchema = z.object({
  content: z.string().optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'VOICE', 'GIF']).default('TEXT'),
  replyToId: z.string().optional(),
  scheduledFor: z.string().optional(),
  expiresIn: z.number().optional(), // Время в секундах до самоуничтожения
  isSilent: z.boolean().optional(),
});

const forwardMessageSchema = z.object({
  chatIds: z.array(z.string()).min(1),
});

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId!;
    const { limit = 50, before } = req.query;

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
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: basicUserSelect,
        },
        replyTo: {
          include: {
            sender: {
              select: basicUserSelect,
            },
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
        await prisma.messageRead.createMany({
          data: newReads,
          skipDuplicates: true,
        });

        // Emit read receipts
        newReads.forEach(({ messageId }) => {
          io.to(`chat:${chatId}`).emit('message:read', { messageId, userId });
        });
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

    const isMember = await checkChatMembership(chatId, userId);

    if (!isMember) {
      return handleForbidden(res, 'Not a member of this chat');
    }

    let fileUrl, fileName, fileSize, thumbnailUrl, duration, waveform;
    let messageType = data.type;

    // Process uploaded file
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;

      // Automatically determine messageType based on MIME type if not explicitly set or is generic 'FILE'
      if (!messageType || messageType === 'FILE') {
        if (req.file.mimetype.startsWith('image/')) {
          messageType = 'IMAGE';
        } else if (req.file.mimetype.startsWith('video/')) {
          messageType = 'VIDEO';
        } else if (req.file.mimetype.startsWith('audio/')) {
          messageType = 'AUDIO';
        } else {
          messageType = 'FILE';
        }
      }

      // Process media (compress, generate thumbnails, etc.)
      try {
        const mediaResult = await processMedia(req.file.path, req.file.mimetype);
        
        if (mediaResult.compressedPath) {
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
        // Continue with original file if processing fails
      }
    }

    // Parse scheduled date if provided
    const scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : undefined;
    const isSent = !scheduledFor;

    // Calculate expiration time if expiresIn is provided
    const expiresAt = data.expiresIn 
      ? new Date(Date.now() + data.expiresIn * 1000)
      : undefined;

    // Extract mentions and hashtags from content
    const mentions = data.content ? JSON.stringify(extractMentions(data.content)) : null;
    const hashtags = data.content ? JSON.stringify(extractHashtags(data.content)) : null;
    
    // Extract links from content for preview (async, don't wait)
    const links = data.content ? extractUrls(data.content) : [];

    const message = await prisma.message.create({
      data: {
        content: data.content,
        type: messageType as any,
        senderId: userId,
        chatId,
        replyToId: data.replyToId,
        fileUrl,
        fileName,
        fileSize,
        thumbnailUrl,
        duration,
        waveform,
        scheduledFor,
        expiresAt,
        isSent,
        isSilent: data.isSilent || false,
        mentions,
        hashtags,
        linkPreview: undefined, // Will be updated asynchronously
      },
      include: {
        sender: {
          select: basicUserSelect,
        },
        replyTo: {
          include: {
            sender: {
              select: basicUserSelect,
            },
          },
        },
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Emit new message via Socket.IO to all chat participants
    io.to(`chat:${chatId}`).emit('message:new', message);

    // Fetch link preview asynchronously (don't wait)
    if (links.length > 0) {
      fetchLinkPreview(links[0])
        .then((preview) => {
          if (preview) {
            // Update message with preview
            prisma.message.update({
              where: { id: message.id },
              data: { linkPreview: JSON.parse(JSON.stringify(preview)) },
            }).then((updatedMessage) => {
              // Emit update to chat
              io.to(`chat:${chatId}`).emit('message:update', updatedMessage);
            }).catch(console.error);
          }
        })
        .catch(console.error);
    }

    // Send push notifications to other members (only if sent immediately and not silent)
    if (isSent && !data.isSilent) {
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { members: true },
      });

      if (chat) {
        const otherMembers = chat.members.filter((m: { userId: string }) => m.userId !== userId);
        const sender = await prisma.user.findUnique({
          where: { id: userId },
          select: { displayName: true, username: true },
        });

        if (sender) {
          const senderName = sender.displayName || sender.username;
          otherMembers.forEach((member: { userId: string }) => {
            sendNewMessageNotification(
              member.userId,
              senderName,
              data.content || 'Sent a file',
              chatId
            ).catch(console.error);
          });
        }
      }
    }

    res.status(201).json(message);
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

    // Verify user is member of all target chats
    for (const targetChatId of chatIds) {
      const isMember = await checkChatMembership(targetChatId, userId);
      if (!isMember) {
        return handleForbidden(res, `Not a member of chat ${targetChatId}`);
      }
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

    // Mark as read
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

    // Emit read receipt
    io.to(`chat:${message.chatId}`).emit('message:read', { messageId, userId });

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
        sender: {
          select: basicUserSelect,
        },
      },
    });

    // Emit update
    io.to(`chat:${message.chatId}`).emit('message:update', updatedMessage);

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

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    handleControllerError(error, res, 'Failed to delete message');
  }
};
