import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { z } from 'zod';
import { processMedia } from '../services/mediaService';
import { sendNewMessageNotification } from '../services/pushService';

const sendMessageSchema = z.object({
  content: z.string().optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'VOICE', 'GIF']).default('TEXT'),
  replyToId: z.string().optional(),
  scheduledFor: z.string().optional(),
});

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId!;
    const { limit = 50, before } = req.query;

    const isMember = await prisma.chatMember.findFirst({
      where: { chatId, userId },
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this chat' });
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        isDeleted: false,
        ...(before && { createdAt: { lt: new Date(before as string) } }),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId!;
    const data = sendMessageSchema.parse(req.body);

    const isMember = await prisma.chatMember.findFirst({
      where: { chatId, userId },
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this chat' });
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
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Send push notifications to other members (only if sent immediately)
    if (isSent) {
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { members: true },
      });

      if (chat) {
        const otherMembers = chat.members.filter((m) => m.userId !== userId);
        const sender = await prisma.user.findUnique({
          where: { id: userId },
          select: { displayName: true, username: true },
        });

        if (sender) {
          const senderName = sender.displayName || sender.username;
          otherMembers.forEach((member) => {
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
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
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content, isEdited: true },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    res.json(updatedMessage);
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Failed to edit message' });
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
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, content: 'Message deleted' },
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};
