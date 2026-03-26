import { Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { deliverWebhook, retryWebhookDelivery } from '../services/webhookService';

const buildDefaultSecret = () => crypto.randomBytes(32).toString('hex');

const ensureBotOwnership = async (botId: string, userId: string) => {
  const bot = await prisma.bot.findUnique({
    where: { id: botId },
  });

  if (!bot) {
    throw new Error('Bot not found');
  }

  if (bot.ownerId !== userId) {
    throw new Error('Forbidden');
  }

  return bot;
};

const ensureWebhookOwnership = async (webhookId: string, userId: string) => {
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
    include: {
      bot: true,
    },
  });

  if (!webhook) {
    throw new Error('Webhook not found');
  }

  if (webhook.bot.ownerId !== userId) {
    throw new Error('Forbidden');
  }

  return webhook;
};

export const createWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { botId, url, events, secret } = req.body;

    if (!botId || !url || !Array.isArray(events)) {
      return res.status(400).json({ error: 'botId, url and events are required' });
    }

    await ensureBotOwnership(botId, userId);

    const webhook = await prisma.webhook.create({
      data: {
        botId,
        url,
        events: JSON.stringify(events),
        secret: secret || buildDefaultSecret(),
      },
    });

    res.status(201).json(webhook);
  } catch (error: any) {
    if (error.message === 'Bot not found') {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'Forbidden') {
      return res.status(403).json({ error: 'You can only create webhooks for your own bots' });
    }

    console.error('Error creating webhook:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
};

export const getBotWebhooks = async (req: AuthRequest, res: Response) => {
  try {
    const { botId } = req.params;
    const userId = req.userId!;

    await ensureBotOwnership(botId, userId);

    const webhooks = await prisma.webhook.findMany({
      where: { botId },
      include: {
        deliveries: {
          orderBy: { deliveredAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(webhooks);
  } catch (error: any) {
    if (error.message === 'Bot not found') {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'Forbidden') {
      return res.status(403).json({ error: 'You can only view webhooks for your own bots' });
    }

    console.error('Error fetching webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
};

export const updateWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { webhookId } = req.params;
    const userId = req.userId!;
    const { url, events, isActive, secret } = req.body;

    await ensureWebhookOwnership(webhookId, userId);

    const updatedWebhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        ...(url !== undefined ? { url } : {}),
        ...(events !== undefined ? { events: JSON.stringify(events) } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(secret !== undefined ? { secret } : {}),
      },
    });

    res.json(updatedWebhook);
  } catch (error: any) {
    if (error.message === 'Webhook not found') {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'Forbidden') {
      return res.status(403).json({ error: 'You can only update webhooks for your own bots' });
    }

    console.error('Error updating webhook:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
};

export const deleteWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { webhookId } = req.params;
    const userId = req.userId!;

    await ensureWebhookOwnership(webhookId, userId);
    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    res.json({ message: 'Webhook deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Webhook not found') {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'Forbidden') {
      return res.status(403).json({ error: 'You can only delete webhooks for your own bots' });
    }

    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
};

export const getWebhookDeliveries = async (req: AuthRequest, res: Response) => {
  try {
    const { webhookId } = req.params;
    const userId = req.userId!;
    const { limit = '50', offset = '0' } = req.query;

    await ensureWebhookOwnership(webhookId, userId);

    const deliveries = await prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { deliveredAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    });

    res.json(deliveries);
  } catch (error: any) {
    if (error.message === 'Webhook not found') {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'Forbidden') {
      return res.status(403).json({ error: 'You can only view deliveries for your own webhooks' });
    }

    console.error('Error fetching webhook deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch webhook deliveries' });
  }
};

export const getBotWebhookDeliveries = async (req: AuthRequest, res: Response) => {
  try {
    const { botId } = req.params;
    const userId = req.userId!;
    const { limit = '30' } = req.query;

    await ensureBotOwnership(botId, userId);

    const deliveries = await prisma.webhookDelivery.findMany({
      where: {
        webhook: {
          botId,
        },
      },
      include: {
        webhook: {
          select: {
            id: true,
            url: true,
            isActive: true,
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
      take: parseInt(limit as string, 10),
    });

    res.json({ deliveries });
  } catch (error: any) {
    if (error.message === 'Bot not found') {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'Forbidden') {
      return res.status(403).json({ error: 'You can only view deliveries for your own bots' });
    }

    console.error('Error fetching bot webhook deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch bot webhook deliveries' });
  }
};

export const testWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { webhookId } = req.params;
    const userId = req.userId!;

    const webhook = await ensureWebhookOwnership(webhookId, userId);
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
      },
    };

    const result = await deliverWebhook(
      {
        id: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
      },
      'webhook.test',
      testPayload
    );

    res.json({
      success: result.success,
      delivery: result.delivery,
    });
  } catch (error: any) {
    if (error.message === 'Webhook not found') {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === 'Forbidden') {
      return res.status(403).json({ error: 'You can only test your own webhooks' });
    }

    console.error('Error testing webhook:', error);
    res.status(500).json({ error: error.message || 'Failed to test webhook' });
  }
};

export const retryDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { deliveryId } = req.params;
    const userId = req.userId!;

    const existingDelivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        webhook: {
          include: {
            bot: true,
          },
        },
      },
    });

    if (!existingDelivery) {
      return res.status(404).json({ error: 'Webhook delivery not found' });
    }

    if (existingDelivery.webhook.bot.ownerId !== userId) {
      return res.status(403).json({ error: 'You can only retry deliveries for your own bots' });
    }

    const retried = await retryWebhookDelivery(deliveryId);
    res.json(retried);
  } catch (error: any) {
    console.error('Error retrying webhook delivery:', error);
    res.status(500).json({ error: error.message || 'Failed to retry webhook delivery' });
  }
};

export const deliverWebhookEvent = async (event: string, payload: unknown): Promise<void> => {
  const webhooks = await prisma.webhook.findMany({
    where: {
      isActive: true,
    },
  });

  const matchingWebhooks = webhooks.filter((webhook) => {
    if (!webhook.events) {
      return true;
    }

    try {
      const parsed = JSON.parse(webhook.events);
      return Array.isArray(parsed)
        ? parsed.includes('*') || parsed.includes(event)
        : false;
    } catch {
      return webhook.events.includes(event);
    }
  });

  await Promise.allSettled(
    matchingWebhooks.map((webhook) =>
      deliverWebhook(
        {
          id: webhook.id,
          url: webhook.url,
          secret: webhook.secret,
        },
        event,
        payload
      )
    )
  );
};
