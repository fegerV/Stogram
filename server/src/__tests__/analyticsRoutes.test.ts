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

jest.mock('../services/analyticsService', () => ({
  __esModule: true,
  AnalyticsService: {
    getSystemAnalytics: jest.fn(),
    getDashboardStats: jest.fn(),
  },
}));

import express from 'express';
import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import analyticsRouter from '../routes/analytics';
import { AnalyticsService } from '../services/analyticsService';

describe('analytics routes', () => {
  const app = express();

  beforeAll(() => {
    app.use(express.json());
    app.use('/analytics', analyticsRouter);
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
    });
  });

  afterAll(() => {
    delete process.env.ADMIN_USER_IDS;
  });

  it('blocks non-admin users from system analytics', async () => {
    const response = await request(app)
      .get('/analytics/system')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Admin access required' });
    expect(AnalyticsService.getSystemAnalytics).not.toHaveBeenCalled();
  });

  it('allows admins to access dashboard stats', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin-user' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-user',
      email: 'admin@example.com',
      username: 'admin',
      displayName: 'Admin',
      avatar: null,
      bio: null,
      status: 'ONLINE',
    });
    (AnalyticsService.getDashboardStats as jest.Mock).mockResolvedValue({
      users: 10,
      messages: 20,
    });

    const response = await request(app)
      .get('/analytics/dashboard')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      stats: {
        users: 10,
        messages: 20,
      },
    });
  });
});
