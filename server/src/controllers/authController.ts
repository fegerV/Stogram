import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { generateVerificationToken, sendVerificationEmail } from '../services/emailService';
import { AuditLogService, AuditAction } from '../services/auditLogService';
import { TwoFactorService } from '../services/twoFactorService';
import { SecurityService } from '../services/securityService';
import { getAccessTokenTtl, getJwtSecret, getRefreshTokenTtlDays } from '../utils/authConfig';

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const createRefreshTokenExpiry = () => {
  const days = getRefreshTokenTtlDays();
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
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
  username: z.string().regex(/^[a-zA-Z0-9_]{3,30}$/),
  password: z.string().min(8),
  displayName: z.string().optional(),
});

const loginSchema = z.object({
  login: z.string(),
  password: z.string(),
  code: z.string().optional(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password, displayName } = registerSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
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
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        password: hashedPassword,
        displayName: displayName || normalizedUsername,
        verificationToken,
        verificationTokenExpiresAt,
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

    let emailSent = false;

    // Send verification email (don't wait for it)
    if (process.env.SMTP_USER) {
      emailSent = true;
      sendVerificationEmail(normalizedEmail, verificationToken, normalizedUsername).catch((error) => {
        console.error('Failed to send verification email:', error);
      });
    }

    // Audit log successful registration
    await AuditLogService.logAuth(
      AuditAction.USER_REGISTER,
      user.id,
      req.ip || req.socket.remoteAddress || 'unknown',
      req.headers['user-agent'] || 'unknown',
      true
    );

    res.status(201).json({
      user,
      requiresEmailVerification: true,
      emailSent,
      message: emailSent
        ? 'Registration successful. Please verify your email before signing in.'
        : 'Registration successful, but email delivery is not configured on the server.',
    });
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
    const { login, password, code } = loginSchema.parse(req.body);
    const normalizedLogin = login.trim();
    const normalizedEmailLogin = normalizedLogin.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmailLogin }, { username: normalizedLogin }],
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

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({
        error: 'Account is temporarily locked due to multiple failed login attempts',
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.lockedUntil,
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      const isNowLocked = await SecurityService.handleFailedLogin(user.id);

      // Audit log failed login attempt
      await AuditLogService.logAuth(
        AuditAction.USER_LOGIN,
        user.id,
        req.ip || req.socket.remoteAddress || 'unknown',
        req.headers['user-agent'] || 'unknown',
        false,
        'Invalid password'
      );

      if (isNowLocked) {
        return res.status(423).json({
          error: 'Account is temporarily locked due to multiple failed login attempts',
          code: 'ACCOUNT_LOCKED',
        });
      }

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await SecurityService.resetFailedLoginAttempts(user.id);

    if (user.twoFactorEnabled) {
      if (!code) {
        return res.status(401).json({
          error: 'Two-factor authentication code is required',
          code: 'TWO_FACTOR_REQUIRED',
        });
      }

      const isValidCode = await TwoFactorService.verify2FACode(user.id, code);
      if (!isValidCode) {
        return res.status(401).json({
          error: 'Invalid two-factor authentication code',
          code: 'TWO_FACTOR_INVALID',
        });
      }
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before signing in',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'ONLINE', lastSeen: new Date() },
    });

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);
    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        device: extractDeviceInfo(req.headers['user-agent']),
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || null,
        expiresAt: createRefreshTokenExpiry(),
      },
    });

    const accessTokenTtl = getAccessTokenTtl() as jwt.SignOptions['expiresIn'];
    const token = jwt.sign(
      { userId: user.id, sessionId: session.id },
      getJwtSecret(),
      { expiresIn: accessTokenTtl }
    );

    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
      emailVerified: user.emailVerified,
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
      where: {
        verificationToken: token,
        verificationTokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
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
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationTokenExpiresAt },
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

const publicResendVerificationSchema = z.object({
  email: z.string().email(),
});

export const resendVerificationEmailPublic = async (req: Request, res: Response) => {
  try {
    const { email } = publicResendVerificationSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && !user.emailVerified) {
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken, verificationTokenExpiresAt },
      });

      if (process.env.SMTP_USER) {
        await sendVerificationEmail(user.email, verificationToken, user.username);
      }
    }

    res.json({
      message: 'If an unverified account exists for this email, a new verification link has been sent.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Public resend verification email error:', error);
    res.status(500).json({ error: 'Failed to process verification email request' });
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
      where: {
        refreshTokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: { user: true },
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (!session.user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before signing in',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);

    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        lastActive: new Date(),
        expiresAt: createRefreshTokenExpiry(),
      },
    });

    const accessTokenTtl = getAccessTokenTtl() as jwt.SignOptions['expiresIn'];
    const token = jwt.sign(
      { userId: session.userId, sessionId: session.id },
      getJwtSecret(),
      { expiresIn: accessTokenTtl }
    );

    res.json({ token, refreshToken: newRefreshToken });
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
    if (req.sessionId) {
      await prisma.userSession.deleteMany({
        where: {
          id: req.sessionId,
          userId: req.userId!,
        },
      });
    } else {
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
