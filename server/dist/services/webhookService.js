"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryWebhookDelivery = exports.deliverToBotWebhooks = exports.deliverWebhook = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const WEBHOOK_TIMEOUT_MS = 5000;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const signPayload = (secret, payload) => crypto_1.default.createHmac('sha256', secret).update(payload).digest('hex');
const isSuccessStatus = (status) => status >= 200 && status < 300;
const parseWebhookEvents = (rawEvents) => {
    if (!rawEvents) {
        return [];
    }
    try {
        const parsed = JSON.parse(rawEvents);
        return Array.isArray(parsed) ? parsed.map((event) => String(event)) : [];
    }
    catch (error) {
        console.error('Failed to parse webhook events:', error);
        return [];
    }
};
const deliverWebhook = async (webhook, event, payload) => {
    const rawPayload = JSON.stringify(payload);
    let attempts = 0;
    let lastStatus = 0;
    let lastResponse = '';
    while (attempts < MAX_ATTEMPTS) {
        attempts += 1;
        try {
            const signature = webhook.secret ? signPayload(webhook.secret, rawPayload) : undefined;
            const response = await axios_1.default.post(webhook.url, payload, {
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
        }
        catch (error) {
            lastStatus = error.response?.status || 0;
            lastResponse = error.response?.data
                ? JSON.stringify(error.response.data)
                : error.message || 'Webhook delivery failed';
        }
        if (attempts < MAX_ATTEMPTS) {
            await sleep(BASE_BACKOFF_MS * attempts);
        }
    }
    const delivery = await prisma_1.default.webhookDelivery.create({
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
exports.deliverWebhook = deliverWebhook;
const deliverToBotWebhooks = async (botId, event, payload) => {
    const webhooks = await prisma_1.default.webhook.findMany({
        where: {
            botId,
            isActive: true,
        },
    });
    const matchingWebhooks = webhooks.filter((webhook) => {
        const subscribedEvents = parseWebhookEvents(webhook.events);
        return subscribedEvents.length === 0 || subscribedEvents.includes('*') || subscribedEvents.includes(event);
    });
    return Promise.allSettled(matchingWebhooks.map((webhook) => (0, exports.deliverWebhook)(webhook, event, payload)));
};
exports.deliverToBotWebhooks = deliverToBotWebhooks;
const retryWebhookDelivery = async (deliveryId) => {
    const delivery = await prisma_1.default.webhookDelivery.findUnique({
        where: { id: deliveryId },
        include: {
            webhook: true,
        },
    });
    if (!delivery) {
        throw new Error('Webhook delivery not found');
    }
    return (0, exports.deliverWebhook)({
        id: delivery.webhook.id,
        url: delivery.webhook.url,
        secret: delivery.webhook.secret,
    }, delivery.event, JSON.parse(delivery.payload));
};
exports.retryWebhookDelivery = retryWebhookDelivery;
//# sourceMappingURL=webhookService.js.map