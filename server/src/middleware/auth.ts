import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
  sessionId?: string;
}

const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.userId = user.id;
    req.user = user;

    const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
    if (refreshToken) {
      const refreshTokenHash = hashToken(refreshToken as string);
      const session = await prisma.userSession.findFirst({
        where: {
          userId: user.id,
          refreshTokenHash,
        },
      });

      if (session) {
        req.sessionId = session.id;
        await prisma.userSession.update({
          where: { id: session.id },
          data: { lastActive: new Date() },
        }).catch(() => {});
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const auth = authenticate;
export const authenticateToken = authenticate;
