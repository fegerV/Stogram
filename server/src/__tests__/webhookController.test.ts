jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    bot: {
      findUnique: jest.fn(),
    },
    webhook: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    webhookDelivery: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../services/webhookService', () => ({
  deliverWebhook: jest.fn(),
  retryWebhookDelivery: jest.fn(),
}));

import { Response } from 'express';
import prisma from '../utils/prisma';
import { createWebhook, getWebhookDeliveries } from '../controllers/webhookController';

describe('webhookController', () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const response = { json, status } as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects private webhook urls on create', async () => {
    const request = {
      userId: 'user-1',
      body: {
        botId: 'bot-1',
        url: 'http://localhost:3000/hook',
        events: ['message.created'],
      },
    } as any;

    await createWebhook(request, response);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: 'Webhook URL cannot target localhost or private network hosts',
    });
  });

  it('rejects access to deliveries of чужой webhook', async () => {
    (prisma.webhook.findUnique as jest.Mock).mockResolvedValue({
      id: 'webhook-1',
      bot: {
        ownerId: 'user-2',
      },
    });

    const request = {
      userId: 'user-1',
      params: { webhookId: 'webhook-1' },
      query: {},
    } as any;

    await getWebhookDeliveries(request, response);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      error: 'You can only view deliveries for your own webhooks',
    });
  });
});
