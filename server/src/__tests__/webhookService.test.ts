jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    webhook: {
      findMany: jest.fn(),
    },
    webhookDelivery: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import axios from 'axios';
import prisma from '../utils/prisma';
import { deliverToBotWebhooks, retryWebhookDelivery } from '../services/webhookService';

describe('webhookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delivers only to subscribed webhooks', async () => {
    (prisma.webhook.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'hook-1',
        url: 'https://example.com/a',
        secret: null,
        events: JSON.stringify(['message.created']),
      },
      {
        id: 'hook-2',
        url: 'https://example.com/b',
        secret: null,
        events: JSON.stringify(['message.deleted']),
      },
      {
        id: 'hook-3',
        url: 'https://example.com/c',
        secret: null,
        events: JSON.stringify(['*']),
      },
    ]);
    (axios.post as jest.Mock).mockResolvedValue({
      status: 200,
      data: { ok: true },
    });
    (prisma.webhookDelivery.create as jest.Mock).mockImplementation(({ data }) =>
      Promise.resolve({ id: `delivery-${data.webhookId}`, ...data }),
    );

    const result = await deliverToBotWebhooks('bot-1', 'message.created', { hello: 'world' });

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post).toHaveBeenNthCalledWith(
      1,
      'https://example.com/a',
      { hello: 'world' },
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Webhook-Event': 'message.created',
        }),
      }),
    );
    expect(axios.post).toHaveBeenNthCalledWith(
      2,
      'https://example.com/c',
      { hello: 'world' },
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Webhook-Event': 'message.created',
        }),
      }),
    );
    expect(result).toHaveLength(2);
  });

  it('retries stored deliveries using the original payload and webhook secret', async () => {
    (prisma.webhookDelivery.findUnique as jest.Mock).mockResolvedValue({
      id: 'delivery-1',
      event: 'message.created',
      payload: JSON.stringify({ id: 'msg-1' }),
      webhook: {
        id: 'hook-1',
        url: 'https://example.com/hook',
        secret: 'top-secret',
      },
    });
    (axios.post as jest.Mock).mockResolvedValue({
      status: 200,
      data: { ok: true },
    });
    (prisma.webhookDelivery.create as jest.Mock).mockImplementation(({ data }) =>
      Promise.resolve({ id: 'delivery-2', ...data }),
    );

    const result = await retryWebhookDelivery('delivery-1');

    expect(axios.post).toHaveBeenCalledWith(
      'https://example.com/hook',
      { id: 'msg-1' },
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Webhook-Event': 'message.created',
          'X-Webhook-Signature': expect.any(String),
        }),
      }),
    );
    expect(prisma.webhookDelivery.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        webhookId: 'hook-1',
        event: 'message.created',
        payload: JSON.stringify({ id: 'msg-1' }),
        attempts: 1,
      }),
    });
    expect(result).toEqual({
      delivery: expect.objectContaining({
        webhookId: 'hook-1',
      }),
      success: true,
    });
  });
});
