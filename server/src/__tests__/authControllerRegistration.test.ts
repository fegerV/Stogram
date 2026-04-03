jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userSession: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../services/emailService', () => ({
  generateVerificationToken: jest.fn(() => 'verification-token'),
  sendVerificationEmail: jest.fn(() => Promise.resolve()),
}));

jest.mock('../services/auditLogService', () => ({
  AuditAction: {
    USER_REGISTER: 'USER_REGISTER',
    USER_LOGIN: 'USER_LOGIN',
    EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  },
  AuditLogService: {
    logAuth: jest.fn(() => Promise.resolve()),
  },
}));

import bcrypt from 'bcryptjs';
import { Response } from 'express';
import prisma from '../utils/prisma';
import {
  login,
  register,
  resendVerificationEmailPublic,
  verifyEmail,
} from '../controllers/authController';
import { sendVerificationEmail } from '../services/emailService';

const createResponse = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));

  return {
    json,
    status,
    response: { json, status } as unknown as Response,
  };
};

describe('authController registration flow', () => {
  const originalSmtpUser = process.env.SMTP_USER;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SMTP_USER = 'smtp@test.local';
  });

  afterAll(() => {
    process.env.SMTP_USER = originalSmtpUser;
  });

  it('registers user without creating session tokens and requires email verification', async () => {
    const { response, status, json } = createResponse();
    const passwordHashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      username: 'new_user',
      displayName: 'New User',
      avatar: null,
      bio: null,
      status: 'OFFLINE',
      emailVerified: false,
      createdAt: new Date('2026-04-03T10:00:00.000Z'),
    });

    const request = {
      body: {
        email: 'New@Example.com',
        username: 'new_user',
        password: 'Password123',
        displayName: 'New User',
      },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      headers: { 'user-agent': 'jest' },
    } as any;

    await register(request, response);

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'new@example.com',
          username: 'new_user',
          verificationToken: 'verification-token',
          verificationTokenExpiresAt: expect.any(Date),
        }),
      })
    );
    expect(prisma.userSession.create).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        requiresEmailVerification: true,
        emailSent: true,
      })
    );
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      'new@example.com',
      'verification-token',
      'new_user'
    );

    passwordHashSpy.mockRestore();
  });

  it('blocks login for unverified users', async () => {
    const { response, status, json } = createResponse();
    const passwordCompareSpy = jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'user-2',
      email: 'pending@example.com',
      username: 'pending_user',
      password: 'hashed-password',
      displayName: 'Pending User',
      avatar: null,
      bio: null,
      status: 'OFFLINE',
      emailVerified: false,
      createdAt: new Date('2026-04-03T10:00:00.000Z'),
    });

    const request = {
      body: {
        login: 'pending@example.com',
        password: 'Password123',
      },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      headers: { 'user-agent': 'jest' },
    } as any;

    await login(request, response);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      error: 'Please verify your email before signing in',
      code: 'EMAIL_NOT_VERIFIED',
    });
    expect(prisma.userSession.create).not.toHaveBeenCalled();

    passwordCompareSpy.mockRestore();
  });

  it('rejects expired verification token', async () => {
    const { response, status, json } = createResponse();

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    const request = {
      body: {
        token: 'expired-token',
      },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      headers: { 'user-agent': 'jest' },
    } as any;

    await verifyEmail(request, response);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        verificationToken: 'expired-token',
        verificationTokenExpiresAt: {
          gt: expect.any(Date),
        },
      },
    });
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: 'Invalid or expired verification token',
    });
  });

  it('public resend endpoint refreshes token for unverified account and stays generic in response', async () => {
    const { response, json } = createResponse();

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-3',
      email: 'pending@example.com',
      username: 'pending_user',
      emailVerified: false,
    });

    const request = {
      body: {
        email: 'Pending@Example.com',
      },
    } as any;

    await resendVerificationEmailPublic(request, response);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'pending@example.com' },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-3' },
      data: {
        verificationToken: 'verification-token',
        verificationTokenExpiresAt: expect.any(Date),
      },
    });
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      'pending@example.com',
      'verification-token',
      'pending_user'
    );
    expect(json).toHaveBeenCalledWith({
      message: 'If an unverified account exists for this email, a new verification link has been sent.',
    });
  });
});
