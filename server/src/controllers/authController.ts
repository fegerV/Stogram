import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { generateVerificationToken, sendVerificationEmail } from '../services/emailService';
import { AuditLogService, AuditAction } from '../services/auditLogService';

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const extractDeviceInfo = (userAgent?: string) => {
  if (!userAgent) return 'Unknown Device';
  
  if (userAgent.includes('Mobile')) return 'Mobile Device';
  if (userAgent.includes('Tablet')) return 'Tablet';
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Mac')) return 'Mac';
  if (userAgent.includes('Linux')) return 'Linux PC';
  
  return 'Unknown Device';
};

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8),
  displayName: z.string().optional(),
});

const loginSchema = z.object({
  login: z.string(),
  password: z.string(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password, displayName } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.BCRYPT_ROUNDS || '12')
    );

    const verificationToken = generateVerificationToken();

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        displayName: displayName || username,
        verificationToken,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Send verification email (don't wait for it)
    if (process.env.SMTP_USER) {
      sendVerificationEmail(email, verificationToken, username).catch((error) => {
        console.error('Failed to send verification email:', error);
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        device: extractDeviceInfo(req.headers['user-agent']),
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || null,
      },
    });

    // Audit log successful registration
    await AuditLogService.logAuth(
      AuditAction.USER_REGISTER,
      user.id,
      req.ip || req.socket.remoteAddress || 'unknown',
      req.headers['user-agent'] || 'unknown',
      true
    );

    res.status(201).json({ user, token, refreshToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { login, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: login }, { username: login }],
      },
    });

    if (!user) {
      // Audit log failed login attempt
      await AuditLogService.logAuth(
        AuditAction.USER_LOGIN,
        'unknown',
        req.ip || req.socket.remoteAddress || 'unknown',
        req.headers['user-agent'] || 'unknown',
        false,
        'User not found'
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Audit log failed login attempt
      await AuditLogService.logAuth(
        AuditAction.USER_LOGIN,
        user.id,
        req.ip || req.socket.remoteAddress || 'unknown',
        req.headers['user-agent'] || 'unknown',
        false,
        'Invalid password'
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'ONLINE', lastSeen: new Date() },
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        device: extractDeviceInfo(req.headers['user-agent']),
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || null,
      },
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
      createdAt: user.createdAt,
    };

    // Audit log successful login
    await AuditLogService.logAuth(
      AuditAction.USER_LOGIN,
      user.id,
      req.ip || req.socket.remoteAddress || 'unknown',
      req.headers['user-agent'] || 'unknown',
      true
    );

    res.json({ user: userResponse, token, refreshToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        status: true,
        lastSeen: true,
        emailVerified: true,
        theme: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const verifyEmailSchema = z.object({
  token: z.string(),
});

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = verifyEmailSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    // Audit log email verification
    await AuditLogService.logAuth(
      AuditAction.EMAIL_VERIFIED,
      user.id,
      req.ip || req.socket.remoteAddress || 'unknown',
      req.headers['user-agent'] || 'unknown',
      true
    );

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
};

export const resendVerificationEmail = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    const verificationToken = generateVerificationToken();

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    if (process.env.SMTP_USER) {
      await sendVerificationEmail(user.email, verificationToken, user.username);
    }

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
};

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const refreshTokenHash = hashToken(refreshToken);

    const session = await prisma.userSession.findFirst({
      where: { refreshTokenHash },
      include: { user: true },
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActive: new Date() },
    });

    const token = jwt.sign(
      { userId: session.userId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
    
    if (refreshToken) {
      const refreshTokenHash = hashToken(refreshToken as string);
      await prisma.userSession.deleteMany({
        where: {
          userId: req.userId!,
          refreshTokenHash,
        },
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

export const logoutAll = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.userSession.deleteMany({
      where: { userId: req.userId! },
    });

    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};
