import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import axios from 'axios';
import crypto from 'crypto';

// Создать вебхук
export const createWebhook = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { botId, url, events, secret } = req.body;

    if (!botId || !url || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'BotId, url, and events array are required' });
    }

    // Проверяем, что пользователь владеет ботом
    const bot = await prisma.bot.findUnique({
      where: { id: botId }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    if (bot.ownerId !== userId) {
      return res.status(403).json({ error: 'You can only create webhooks for your own bots' });
    }

    const webhook = await prisma.webhook.create({
      data: {
        botId,
        url,
        events,
        secret: secret || crypto.randomBytes(32).toString('hex')
      }
    });

    res.status(201).json(webhook);
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
};

// Получить все вебхуки бота
export const getBotWebhooks = async (req: Request, res: Response) => {
  try {
    const { botId } = req.params;
    const userId = req.user?.id;

    const bot = await prisma.bot.findUnique({
      where: { id: botId }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    if (bot.ownerId !== userId) {
      return res.status(403).json({ error: 'You can only view webhooks for your own bots' });
    }

    const webhooks = await prisma.webhook.findMany({
      where: { botId },
      include: {
        deliveries: {
          orderBy: { deliveredAt: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(webhooks);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
};

// Обновить вебхук
export const updateWebhook = async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const userId = req.user?.id;
    const { url, events, isActive } = req.body;

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
      include: { bot: true }
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (webhook.bot.ownerId !== userId) {
      return res.status(403).json({ error: 'You can only update webhooks for your own bots' });
    }

    const updatedWebhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        url,
        events,
        isActive
      }
    });

    res.json(updatedWebhook);
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
};

// Удалить вебхук
export const deleteWebhook = async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const userId = req.user?.id;

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
      include: { bot: true }
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (webhook.bot.ownerId !== userId) {
      return res.status(403).json({ error: 'You can only delete webhooks for your own bots' });
    }

    await prisma.webhook.delete({
      where: { id: webhookId }
    });

    res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
};

// Доставить событие на вебхук
export const deliverWebhookEvent = async (
  event: string,
  payload: any
): Promise<void> => {
  try {
    // Найти все активные вебхуки, подписанные на это событие
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
        events: {
          has: event
        }
      }
    });

    // Отправить запрос на каждый вебхук
    for (const webhook of webhooks) {
      try {
        const signature = webhook.secret
          ? crypto
              .createHmac('sha256', webhook.secret)
              .update(JSON.stringify(payload))
              .digest('hex')
          : undefined;

        const response = await axios.post(webhook.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event
          },
          timeout: 5000
        });

        // Сохранить успешную доставку
        await prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event,
            payload: JSON.stringify(payload),
            status: response.status,
            response: JSON.stringify(response.data),
            attempts: 1
          }
        });
      } catch (error: any) {
        console.error(`Error delivering webhook ${webhook.id}:`, error.message);

        // Сохранить неудачную доставку
        await prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event,
            payload: JSON.stringify(payload),
            status: error.response?.status || 0,
            response: error.message,
            attempts: 1
          }
        });
      }
    }
  } catch (error) {
    console.error('Error in webhook delivery:', error);
  }
};

// Получить историю доставок вебхука
export const getWebhookDeliveries = async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const userId = req.user?.id;
    const { limit = '50', offset = '0' } = req.query;

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
      include: { bot: true }
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (webhook.bot.ownerId !== userId) {
      return res.status(403).json({ error: 'You can only view deliveries for your own webhooks' });
    }

    const deliveries = await prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { deliveredAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json(deliveries);
  } catch (error) {
    console.error('Error fetching webhook deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch webhook deliveries' });
  }
};

// Тестовый запрос на вебхук
export const testWebhook = async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.params;
    const userId = req.user?.id;

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
      include: { bot: true }
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (webhook.bot.ownerId !== userId) {
      return res.status(403).json({ error: 'You can only test your own webhooks' });
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery'
      }
    };

    const signature = webhook.secret
      ? crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(testPayload))
          .digest('hex')
      : undefined;

    const response = await axios.post(webhook.url, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': 'webhook.test'
      },
      timeout: 5000
    });

    res.json({
      success: true,
      status: response.status,
      data: response.data
    });
  } catch (error: any) {
    console.error('Error testing webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      status: error.response?.status || 0
    });
  }
};
