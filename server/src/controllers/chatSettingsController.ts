import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getChatSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { chatId } = req.params;

    let settings = await prisma.chatSettings.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      },
      include: {
        folder: true
      }
    });

    if (!settings) {
      settings = await prisma.chatSettings.create({
        data: {
          userId,
          chatId
        },
        include: {
          folder: true
        }
      });
    }

    res.json({ settings });
  } catch (error) {
    console.error('Get chat settings error:', error);
    res.status(500).json({ error: 'Failed to get chat settings' });
  }
};

export const updateChatSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { chatId } = req.params;
    const { isMuted, isFavorite, folderId } = req.body;

    const settings = await prisma.chatSettings.upsert({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      },
      update: {
        isMuted: isMuted !== undefined ? isMuted : undefined,
        isFavorite: isFavorite !== undefined ? isFavorite : undefined,
        folderId: folderId !== undefined ? folderId : undefined
      },
      create: {
        userId,
        chatId,
        isMuted: isMuted || false,
        isFavorite: isFavorite || false,
        folderId: folderId || null
      },
      include: {
        folder: true
      }
    });

    res.json({ settings });
  } catch (error) {
    console.error('Update chat settings error:', error);
    res.status(500).json({ error: 'Failed to update chat settings' });
  }
};

export const muteChat = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { chatId } = req.params;

    const settings = await prisma.chatSettings.upsert({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      },
      update: {
        isMuted: true
      },
      create: {
        userId,
        chatId,
        isMuted: true
      }
    });

    res.json({ settings, message: 'Chat muted successfully' });
  } catch (error) {
    console.error('Mute chat error:', error);
    res.status(500).json({ error: 'Failed to mute chat' });
  }
};

export const unmuteChat = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { chatId } = req.params;

    const settings = await prisma.chatSettings.upsert({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      },
      update: {
        isMuted: false
      },
      create: {
        userId,
        chatId,
        isMuted: false
      }
    });

    res.json({ settings, message: 'Chat unmuted successfully' });
  } catch (error) {
    console.error('Unmute chat error:', error);
    res.status(500).json({ error: 'Failed to unmute chat' });
  }
};

export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { chatId } = req.params;

    const existingSettings = await prisma.chatSettings.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      }
    });

    const settings = await prisma.chatSettings.upsert({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      },
      update: {
        isFavorite: !existingSettings?.isFavorite
      },
      create: {
        userId,
        chatId,
        isFavorite: true
      }
    });

    res.json({ settings });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

export const updateUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { chatId } = req.params;
    const { count, lastReadMessageId } = req.body;

    const settings = await prisma.chatSettings.upsert({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      },
      update: {
        unreadCount: count,
        lastReadMessageId: lastReadMessageId || undefined
      },
      create: {
        userId,
        chatId,
        unreadCount: count || 0,
        lastReadMessageId: lastReadMessageId || null
      }
    });

    res.json({ settings });
  } catch (error) {
    console.error('Update unread count error:', error);
    res.status(500).json({ error: 'Failed to update unread count' });
  }
};

export const resetUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { chatId } = req.params;

    const settings = await prisma.chatSettings.upsert({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      },
      update: {
        unreadCount: 0
      },
      create: {
        userId,
        chatId,
        unreadCount: 0
      }
    });

    res.json({ settings });
  } catch (error) {
    console.error('Reset unread count error:', error);
    res.status(500).json({ error: 'Failed to reset unread count' });
  }
};
