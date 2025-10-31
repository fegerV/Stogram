import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { deliverWebhookEvent } from './webhookController';

const prisma = new PrismaClient();

// Получить события для n8n
export const getEvents = async (req: Request, res: Response) => {
  try {
    res.json({
      events: [
        'message.created',
        'message.updated',
        'message.deleted',
        'chat.created',
        'chat.updated',
        'user.status_changed',
        'call.initiated',
        'call.ended',
        'reaction.added',
        'member.joined',
        'member.left'
      ]
    });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
};

// Получить список чатов пользователя (для n8n)
export const getChatsForN8n = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const chatMembers = await prisma.chatMember.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const chats = chatMembers.map(cm => ({
      id: cm.chat.id,
      name: cm.chat.name,
      type: cm.chat.type,
      avatar: cm.chat.avatar,
      members: cm.chat.members.map(m => m.user)
    }));

    res.json({ chats });
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
};

// Отправить сообщение (для n8n)
export const sendMessageFromN8n = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { chatId, content, type, stickerId } = req.body;

    if (!chatId || !content) {
      return res.status(400).json({ error: 'ChatId and content are required' });
    }

    const message = await prisma.message.create({
      data: {
        content,
        type: type || 'TEXT',
        senderId: userId,
        chatId,
        stickerId,
        isSent: true
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    });

    // Отправить событие на вебхуки
    await deliverWebhookEvent('message.created', {
      message,
      chatId,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Получить сообщения чата (для n8n)
export const getChatMessagesForN8n = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { chatId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    // Проверяем, что пользователь является членом чата
    const isMember = await prisma.chatMember.findFirst({
      where: { chatId, userId }
    });

    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json({ messages });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

// Создать чат (для n8n)
export const createChatFromN8n = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, memberIds, description } = req.body;

    if (!type || !memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({ error: 'Type and memberIds array are required' });
    }

    if (type === 'GROUP' && !name) {
      return res.status(400).json({ error: 'Name is required for group chats' });
    }

    const chat = await prisma.chat.create({
      data: {
        name,
        type,
        description,
        members: {
          create: [
            { userId, role: 'OWNER' },
            ...memberIds.map((id: string) => ({ userId: id, role: 'MEMBER' as const }))
          ]
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    // Отправить событие на вебхуки
    await deliverWebhookEvent('chat.created', {
      chat,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ chat });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
};

// Получить информацию о пользователе (для n8n)
export const getUserInfoForN8n = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        status: true,
        lastSeen: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
};
