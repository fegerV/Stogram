import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const pinMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { messageId, chatId } = req.body;

    if (!messageId || !chatId) {
      return res.status(400).json({ error: 'Message ID and Chat ID are required' });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message || message.chatId !== chatId) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const existingPin = await prisma.pinnedMessage.findUnique({
      where: {
        userId_messageId_chatId: {
          userId,
          messageId,
          chatId
        }
      }
    });

    if (existingPin) {
      return res.status(400).json({ error: 'Message already pinned' });
    }

    const pinnedMessage = await prisma.pinnedMessage.create({
      data: {
        userId,
        messageId,
        chatId
      },
      include: {
        message: {
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
        }
      }
    });

    res.status(201).json({ pinnedMessage });
  } catch (error) {
    console.error('Pin message error:', error);
    res.status(500).json({ error: 'Failed to pin message' });
  }
};

export const unpinMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { messageId, chatId } = req.params;

    const pinnedMessage = await prisma.pinnedMessage.findUnique({
      where: {
        userId_messageId_chatId: {
          userId,
          messageId,
          chatId
        }
      }
    });

    if (!pinnedMessage) {
      return res.status(404).json({ error: 'Pinned message not found' });
    }

    await prisma.pinnedMessage.delete({
      where: {
        userId_messageId_chatId: {
          userId,
          messageId,
          chatId
        }
      }
    });

    res.json({ message: 'Message unpinned successfully' });
  } catch (error) {
    console.error('Unpin message error:', error);
    res.status(500).json({ error: 'Failed to unpin message' });
  }
};

export const getPinnedMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { chatId } = req.params;

    const pinnedMessages = await prisma.pinnedMessage.findMany({
      where: {
        userId,
        chatId
      },
      include: {
        message: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
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
          }
        }
      },
      orderBy: { pinnedAt: 'desc' }
    });

    res.json({ pinnedMessages });
  } catch (error) {
    console.error('Get pinned messages error:', error);
    res.status(500).json({ error: 'Failed to get pinned messages' });
  }
};

export const getAllPinnedMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const pinnedMessages = await prisma.pinnedMessage.findMany({
      where: { userId },
      include: {
        message: {
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
          }
        }
      },
      orderBy: { pinnedAt: 'desc' }
    });

    res.json({ pinnedMessages });
  } catch (error) {
    console.error('Get all pinned messages error:', error);
    res.status(500).json({ error: 'Failed to get all pinned messages' });
  }
};
