import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import * as crypto from 'crypto';

const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.userSession.findMany({
      where: { userId: req.userId! },
      orderBy: { lastActive: 'desc' },
      select: {
        id: true,
        device: true,
        ipAddress: true,
        userAgent: true,
        lastActive: true,
        createdAt: true,
      },
    });

    const currentRefreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
    let currentSessionId: string | null = null;

    if (currentRefreshToken) {
      const refreshTokenHash = hashToken(currentRefreshToken as string);
      const currentSession = await prisma.userSession.findFirst({
        where: {
          userId: req.userId!,
          refreshTokenHash,
        },
        select: { id: true },
      });
      currentSessionId = currentSession?.id || null;
    }

    const sessionsWithCurrent = sessions.map((session) => ({
      ...session,
      isCurrent: session.id === currentSessionId,
    }));

    res.json({ sessions: sessionsWithCurrent });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

export const revokeSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const session = await prisma.userSession.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await prisma.userSession.delete({
      where: { id },
    });

    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
};

export const revokeAllSessions = async (req: AuthRequest, res: Response) => {
  try {
    const currentRefreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
    
    if (currentRefreshToken) {
      const refreshTokenHash = hashToken(currentRefreshToken as string);
      await prisma.userSession.deleteMany({
        where: {
          userId: req.userId!,
          NOT: {
            refreshTokenHash,
          },
        },
      });
    } else {
      await prisma.userSession.deleteMany({
        where: { userId: req.userId! },
      });
    }

    res.json({ message: 'All other sessions revoked successfully' });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
};
