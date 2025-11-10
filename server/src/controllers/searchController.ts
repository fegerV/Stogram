import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const searchMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { query, chatId, type } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Get all chats user is member of
    const userChatIds = await prisma.chatMember.findMany({
      where: { userId },
      select: { chatId: true }
    });

    const chatIds = userChatIds.map((cm: { chatId: string }) => cm.chatId);

    const whereClause: any = {
      chatId: chatId ? String(chatId) : { in: chatIds },
      isDeleted: false,
      OR: [
        { content: { contains: query, mode: 'insensitive' } },
        { fileName: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (type) {
      whereClause.type = type;
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        chat: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                username: true,
                displayName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ messages });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
};

export const searchByHashtag = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { hashtag } = req.params;

    if (!hashtag) {
      return res.status(400).json({ error: 'Hashtag is required' });
    }

    const userChatIds = await prisma.chatMember.findMany({
      where: { userId },
      select: { chatId: true }
    });

    const chatIds = userChatIds.map((cm: { chatId: string }) => cm.chatId);

    const messages = await prisma.message.findMany({
      where: {
        chatId: { in: chatIds },
        isDeleted: false,
        hashtags: { has: hashtag }
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        chat: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ messages });
  } catch (error) {
    console.error('Search by hashtag error:', error);
    res.status(500).json({ error: 'Failed to search by hashtag' });
  }
};

export const searchByMention = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const username = req.params.username || req.user?.username;

    const userChatIds = await prisma.chatMember.findMany({
      where: { userId },
      select: { chatId: true }
    });

    const chatIds = userChatIds.map((cm: { chatId: string }) => cm.chatId);

    const messages = await prisma.message.findMany({
      where: {
        chatId: { in: chatIds },
        isDeleted: false,
        mentions: { has: username }
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        chat: {
          select: {
            id: true,
            name: true,
            type: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ messages });
  } catch (error) {
    console.error('Search by mention error:', error);
    res.status(500).json({ error: 'Failed to search mentions' });
  }
};
