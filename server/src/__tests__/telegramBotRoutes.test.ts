jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    userSession: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import express from 'express';
import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import telegramBotRouter from '../routes/telegramBot';

describe('telegram bot routes', () => {
  const app = express();

  beforeAll(() => {
    app.use(express.json());
    app.use('/telegram-bot', telegramBotRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_USER_IDS = 'admin-user';

    (jwt.verify as jest.Mock).mockReturnValue({ userId: 'regular-user' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'regular-user',
      email: 'user@example.com',
      username: 'user',
      displayName: 'User',
      avatar: null,
      bio: null,
      status: 'ONLINE',
      emailVerified: true,
    });
  });

  afterAll(() => {
    delete process.env.ADMIN_USER_IDS;
  });

  it('blocks non-admin users from test-connection', async () => {
    const response = await request(app)
      .post('/telegram-bot/test-connection')
      .set('Authorization', 'Bearer token')
      .send({ botToken: '123:abc' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Admin access required' });
  });

  it('requires an explicit bot token even for admins', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin-user' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-user',
      email: 'admin@example.com',
      username: 'admin',
      displayName: 'Admin',
      avatar: null,
      bio: null,
      status: 'ONLINE',
      emailVerified: true,
    });

    const response = await request(app)
      .post('/telegram-bot/test-connection')
      .set('Authorization', 'Bearer token')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Bot token is required' });
  });
});
