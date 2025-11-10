import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { processMedia } from '../services/mediaService';
import { sendNewMessageNotification } from '../services/pushService';
import { handleControllerError, handleNotFound, handleForbidden } from '../utils/errorHandlers';
import { checkChatMembership } from '../utils/permissions';
import { extractMentions, extractHashtags } from '../utils/textParsers';
import { basicUserSelect } from '../utils/userSelect';

const sendMessageSchema = z.object({
  content: z.string().optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'VOICE', 'GIF']).default('TEXT'),
  replyToId: z.string().optional(),
  scheduledFor: z.string().optional(),
  isSilent: z.boolean().optional(),
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

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        isDeleted: false,
        ...(before && { createdAt: { lt: new Date(before as string) } }),
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
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

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
    
    // Process uploaded file
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;

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
    const isSent = !scheduledFor; // If not scheduled, mark as sent immediately

    // Extract mentions and hashtags from content
    const mentions = data.content ? extractMentions(data.content) : [];
    const hashtags = data.content ? extractHashtags(data.content) : [];

    const message = await prisma.message.create({
      data: {
        content: data.content,
        type: data.type,
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
        isSent,
        isSilent: data.isSilent || false,
        mentions,
        hashtags,
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

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    handleControllerError(error, res, 'Failed to delete message');
  }
};
