import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { blockedId } = req.params;

    if (userId === blockedId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const user = await prisma.user.findUnique({
      where: { id: blockedId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingBlock = await prisma.blockedUser.findUnique({
      where: {
        userId_blockedId: {
          userId,
          blockedId
        }
      }
    });

    if (existingBlock) {
      return res.status(400).json({ error: 'User already blocked' });
    }

    const block = await prisma.blockedUser.create({
      data: {
        userId,
        blockedId
      },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({ block, message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
};

export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { blockedId } = req.params;

    const block = await prisma.blockedUser.findUnique({
      where: {
        userId_blockedId: {
          userId,
          blockedId
        }
      }
    });

    if (!block) {
      return res.status(404).json({ error: 'User is not blocked' });
    }

    await prisma.blockedUser.delete({
      where: {
        userId_blockedId: {
          userId,
          blockedId
        }
      }
    });

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
};

export const getBlockedUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const blockedUsers = await prisma.blockedUser.findMany({
      where: { userId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ blockedUsers });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ error: 'Failed to get blocked users' });
  }
};

export const isUserBlocked = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { targetUserId } = req.params;

    const block = await prisma.blockedUser.findUnique({
      where: {
        userId_blockedId: {
          userId,
          blockedId: targetUserId
        }
      }
    });

    res.json({ isBlocked: !!block });
  } catch (error) {
    console.error('Check if user blocked error:', error);
    res.status(500).json({ error: 'Failed to check block status' });
  }
};
