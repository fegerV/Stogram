import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { z } from 'zod';
import n8nService from '../services/n8nService';
import {
  assertCanPinMessage,
  checkChatAdminPermission,
  checkChatOwnership,
} from '../utils/permissions';

const createChatSchema = z.object({
  type: z.enum(['PRIVATE', 'GROUP', 'CHANNEL']),
  name: z.string().optional(),
  description: z.string().optional(),
  memberIds: z.array(z.string()),
});

const pinMessageSchema = z.object({
  messageId: z.string(),
});

export const createChat = async (req: AuthRequest, res: Response) => {
  try {
    const { type, name, description, memberIds } = createChatSchema.parse(req.body);
    const userId = req.userId!;

    if (type === 'PRIVATE' && memberIds.length !== 1) {
      return res.status(400).json({ error: 'Private chat requires exactly one member' });
    }

    if (type === 'PRIVATE') {
      const existingChats = await prisma.chat.findMany({
        where: {
          type: 'PRIVATE',
          AND: [
            { members: { some: { userId } } },
            { members: { some: { userId: memberIds[0] } } },
          ],
        },
        include: {
          members: {
            include: { user: true },
          },
        },
      });
      const participantIds = new Set([userId, memberIds[0]]);
      const existingChat = existingChats.find((chat) => (
        chat.members.length === participantIds.size &&
        chat.members.every((member) => participantIds.has(member.userId))
      ));

      if (existingChat) {
        return res.json(existingChat);
      }
    }

    const chat = await prisma.chat.create({
      data: {
        type,
        name,
        description,
        members: {
          create: [
            { userId, role: 'OWNER' },
            ...memberIds.map((id) => ({ userId: id, role: 'MEMBER' as const })),
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // Send n8n webhook event (async, don't wait)
    n8nService.deliverWebhookEvent('new_chat', {
      chatId: chat.id,
      type: chat.type,
      name: chat.name,
      createdBy: userId,
      memberIds: [userId, ...memberIds],
      timestamp: chat.createdAt.toISOString(),
    }).catch(console.error);

    res.status(201).json(chat);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
};

export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    console.log('Getting chats for user:', userId);

    // Сначала проверяем, что пользователь существует
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Получаем чаты - сначала упрощенный запрос для диагностики
    let chats;
    try {
      chats = await prisma.chat.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  status: true,
                  lastSeen: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
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
          pinnedMessage: {
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
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Попробуем упрощенный запрос без messages
      chats = await prisma.chat.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  status: true,
                  lastSeen: true,
                },
              },
            },
          },
          pinnedMessage: {
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
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
      // Добавляем пустой массив messages для каждого чата
      chats = chats.map((chat: any) => ({
        ...chat,
        messages: [],
      }));
    }

    console.log(`Found ${chats.length} chats for user ${userId}`);
    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Логируем в файл
      try {
        const fs = require('fs');
        const path = require('path');
        const logDir = path.join(__dirname, '../../logs');
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        const logMessage = `[${new Date().toISOString()}] Get chats error: ${error.message}\n${error.stack}\n\n`;
        fs.appendFileSync(path.join(logDir, 'error.log'), logMessage);
      } catch (logError) {
        console.error('Failed to write to log file:', logError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch chats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getChatById = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId!;

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                status: true,
                lastSeen: true,
              },
            },
          },
        },
        pinnedMessage: {
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
        },
      },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
};

export const updateChat = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId!;
    const { name, description, avatar } = req.body;

    if (!(await checkChatAdminPermission(chatId, userId))) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: { name, description, avatar },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
      },
    });

    res.json(chat);
  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({ error: 'Failed to update chat' });
  }
};

export const deleteChat = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId!;

    if (!(await checkChatOwnership(chatId, userId))) {
      return res.status(403).json({ error: 'Only owner can delete chat' });
    }

    await prisma.chat.delete({
      where: { id: chatId },
    });

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};

export const addMember = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const { userId: newUserId } = req.body;
    const userId = req.userId!;

    if (!(await checkChatAdminPermission(chatId, userId))) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const newMember = await prisma.chatMember.create({
      data: {
        chatId,
        userId: newUserId,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            status: true,
          },
        },
      },
    });

    res.status(201).json(newMember);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, memberId } = req.params;
    const userId = req.userId!;

    if (!(await checkChatAdminPermission(chatId, userId))) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await prisma.chatMember.delete({
      where: {
        id: memberId,
      },
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

export const pinMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { chatId } = req.params;
    const { messageId } = pinMessageSchema.parse(req.body);

    try {
      await assertCanPinMessage(chatId, userId);
    } catch {
      return res.status(403).json({ error: 'Only owners and admins can pin messages' });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.chatId !== chatId) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: { pinnedMessageId: messageId },
      include: {
        pinnedMessage: {
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
        },
        members: {
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
        },
      },
    });

    res.json({ chat, message: 'Message pinned successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Pin message error:', error);
    res.status(500).json({ error: 'Failed to pin message' });
  }
};

export const unpinMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { chatId } = req.params;

    try {
      await assertCanPinMessage(chatId, userId);
    } catch {
      return res.status(403).json({ error: 'Only owners and admins can unpin messages' });
    }

    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: { pinnedMessageId: null },
      include: {
        pinnedMessage: {
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
        },
        members: {
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
        },
      },
    });

    res.json({ chat, message: 'Message unpinned successfully' });
  } catch (error) {
    console.error('Unpin message error:', error);
    res.status(500).json({ error: 'Failed to unpin message' });
  }
};
