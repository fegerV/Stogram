import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { z } from 'zod';

const createChatSchema = z.object({
  type: z.enum(['PRIVATE', 'GROUP', 'CHANNEL']),
  name: z.string().optional(),
  description: z.string().optional(),
  memberIds: z.array(z.string()),
});

export const createChat = async (req: AuthRequest, res: Response) => {
  try {
    const { type, name, description, memberIds } = createChatSchema.parse(req.body);
    const userId = req.userId!;

    if (type === 'PRIVATE' && memberIds.length !== 1) {
      return res.status(400).json({ error: 'Private chat requires exactly one member' });
    }

    if (type === 'PRIVATE') {
      const existingChat = await prisma.chat.findFirst({
        where: {
          type: 'PRIVATE',
          members: {
            every: {
              userId: { in: [userId, memberIds[0]] },
            },
          },
        },
        include: {
          members: {
            include: { user: true },
          },
        },
      });

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

    const chats = await prisma.chat.findMany({
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
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
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

    const member = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!member) {
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

    const member = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        role: 'OWNER',
      },
    });

    if (!member) {
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

    const member = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!member) {
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

    const member = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!member) {
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
