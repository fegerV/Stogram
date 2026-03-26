import axios from 'axios';
import crypto from 'crypto';
import prisma from '../utils/prisma';

const WEBHOOK_TIMEOUT_MS = 5000;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const signPayload = (secret: string, payload: string) =>
  crypto.createHmac('sha256', secret).update(payload).digest('hex');

const isSuccessStatus = (status: number) => status >= 200 && status < 300;

const parseWebhookEvents = (rawEvents?: string | null) => {
  if (!rawEvents) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawEvents);
    return Array.isArray(parsed) ? parsed.map((event) => String(event)) : [];
  } catch {
    return [];
  }
};

export const deliverWebhook = async (
  webhook: {
    id: string;
    url: string;
    secret?: string | null;
  },
  event: string,
  payload: unknown
) => {
  const rawPayload = JSON.stringify(payload);
  let attempts = 0;
  let lastStatus = 0;
  let lastResponse = '';

  while (attempts < MAX_ATTEMPTS) {
    attempts += 1;

    try {
      const signature = webhook.secret ? signPayload(webhook.secret, rawPayload) : undefined;
      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Signature': signature,
        },
        timeout: WEBHOOK_TIMEOUT_MS,
      });

      lastStatus = response.status;
      lastResponse = JSON.stringify(response.data);

      if (isSuccessStatus(response.status)) {
        break;
      }
    } catch (error: any) {
      lastStatus = error.response?.status || 0;
      lastResponse = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message || 'Webhook delivery failed';
    }

    if (attempts < MAX_ATTEMPTS) {
      await sleep(BASE_BACKOFF_MS * attempts);
    }
  }

  const delivery = await prisma.webhookDelivery.create({
    data: {
      webhookId: webhook.id,
      event,
      payload: rawPayload,
      status: lastStatus,
      response: lastResponse,
      attempts,
    },
  });

  return {
    delivery,
    success: isSuccessStatus(lastStatus),
  };
};

export const deliverToBotWebhooks = async (botId: string, event: string, payload: unknown) => {
  const webhooks = await prisma.webhook.findMany({
    where: {
      botId,
      isActive: true,
    },
  });

  const matchingWebhooks = webhooks.filter((webhook) => {
    const subscribedEvents = parseWebhookEvents(webhook.events);
    return subscribedEvents.length === 0 || subscribedEvents.includes('*') || subscribedEvents.includes(event);
  });

  return Promise.allSettled(
    matchingWebhooks.map((webhook) => deliverWebhook(webhook, event, payload))
  );
};

export const retryWebhookDelivery = async (deliveryId: string) => {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: {
      webhook: true,
    },
  });

  if (!delivery) {
    throw new Error('Webhook delivery not found');
  }

  return deliverWebhook(
    {
      id: delivery.webhook.id,
      url: delivery.webhook.url,
      secret: delivery.webhook.secret,
    },
    delivery.event,
    JSON.parse(delivery.payload)
  );
};
