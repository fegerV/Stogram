import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { getJwtSecret } from '../utils/authConfig';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
  sessionId?: string;
}

const getAdminIdentifiers = () =>
  (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

const resolveAuthenticatedUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  options?: { requireVerified?: boolean }
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as {
      userId: string;
      sessionId?: string;
    };

    if (!decoded.sessionId) {
      return res.status(401).json({ error: 'Invalid session token' });
    }

    const session = await prisma.userSession.findFirst({
      where: {
        id: decoded.sessionId,
        userId: decoded.userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: { id: true },
    });

    if (!session) {
      return res.status(401).json({ error: 'Session expired or revoked' });
    }

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
        emailVerified: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (options?.requireVerified !== false && !user.emailVerified) {
      return res.status(403).json({ error: 'Email verification required' });
    }

    req.userId = user.id;
    req.user = user;
    req.sessionId = session.id;

    try {
      await prisma.userSession.update({
        where: { id: session.id },
        data: { lastActive: new Date() },
      });
    } catch {
      // Best-effort touch for session activity
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => resolveAuthenticatedUser(req, res, next, { requireVerified: true });

export const authenticateAllowUnverified = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => resolveAuthenticatedUser(req, res, next, { requireVerified: false });

export const auth = authenticate;
export const authenticateToken = authenticate;

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const adminIdentifiers = getAdminIdentifiers();

  if (adminIdentifiers.length === 0) {
    return res.status(403).json({
      error: 'Admin access is not configured. Set ADMIN_USER_IDS to enable admin routes.',
    });
  }

  const matchesAdmin = adminIdentifiers.includes(req.userId || '')
    || adminIdentifiers.includes(req.user?.email || '')
    || adminIdentifiers.includes(req.user?.username || '');

  if (!matchesAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};
