"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliverWebhookEvent = exports.retryDelivery = exports.testWebhook = exports.getBotWebhookDeliveries = exports.getWebhookDeliveries = exports.deleteWebhook = exports.updateWebhook = exports.getBotWebhooks = exports.createWebhook = void 0;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const webhookService_1 = require("../services/webhookService");
const webhookValidation_1 = require("../utils/webhookValidation");
const buildDefaultSecret = () => crypto_1.default.randomBytes(32).toString('hex');
const MAX_DELIVERY_PAGE_SIZE = 100;
const normalizeWebhookEvents = (events) => {
    if (!Array.isArray(events)) {
        return null;
    }
    const normalized = Array.from(new Set(events
        .map((event) => (typeof event === 'string' ? event.trim() : ''))
        .filter(Boolean)));
    return normalized.length > 0 ? normalized : null;
};
const ensureBotOwnership = async (botId, userId) => {
    const bot = await prisma_1.default.bot.findUnique({
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
const ensureWebhookOwnership = async (webhookId, userId) => {
    const webhook = await prisma_1.default.webhook.findUnique({
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
const createWebhook = async (req, res) => {
    try {
        const userId = req.userId;
        const { botId, url, events, secret } = req.body;
        const normalizedEvents = normalizeWebhookEvents(events);
        if (!botId || !url || !normalizedEvents) {
            return res.status(400).json({ error: 'botId, url and events are required' });
        }
        const urlValidation = (0, webhookValidation_1.validateOutgoingWebhookUrl)(url);
        if (!urlValidation.ok) {
            return res.status(400).json({ error: urlValidation.error });
        }
        await ensureBotOwnership(botId, userId);
        const webhook = await prisma_1.default.webhook.create({
            data: {
                botId,
                url,
                events: JSON.stringify(normalizedEvents),
                secret: secret || buildDefaultSecret(),
            },
        });
        res.status(201).json(webhook);
    }
    catch (error) {
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
exports.createWebhook = createWebhook;
const getBotWebhooks = async (req, res) => {
    try {
        const { botId } = req.params;
        const userId = req.userId;
        await ensureBotOwnership(botId, userId);
        const webhooks = await prisma_1.default.webhook.findMany({
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
    }
    catch (error) {
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
exports.getBotWebhooks = getBotWebhooks;
const updateWebhook = async (req, res) => {
    try {
        const { webhookId } = req.params;
        const userId = req.userId;
        const { url, events, isActive, secret } = req.body;
        const normalizedEvents = events !== undefined ? normalizeWebhookEvents(events) : undefined;
        if (url !== undefined) {
            const urlValidation = (0, webhookValidation_1.validateOutgoingWebhookUrl)(url);
            if (!urlValidation.ok) {
                return res.status(400).json({ error: urlValidation.error });
            }
        }
        if (events !== undefined && !normalizedEvents) {
            return res.status(400).json({ error: 'events must be a non-empty array of strings' });
        }
        await ensureWebhookOwnership(webhookId, userId);
        const updatedWebhook = await prisma_1.default.webhook.update({
            where: { id: webhookId },
            data: {
                ...(url !== undefined ? { url } : {}),
                ...(normalizedEvents !== undefined ? { events: JSON.stringify(normalizedEvents) } : {}),
                ...(isActive !== undefined ? { isActive } : {}),
                ...(secret !== undefined ? { secret } : {}),
            },
        });
        res.json(updatedWebhook);
    }
    catch (error) {
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
exports.updateWebhook = updateWebhook;
const deleteWebhook = async (req, res) => {
    try {
        const { webhookId } = req.params;
        const userId = req.userId;
        await ensureWebhookOwnership(webhookId, userId);
        await prisma_1.default.webhook.delete({
            where: { id: webhookId },
        });
        res.json({ message: 'Webhook deleted successfully' });
    }
    catch (error) {
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
exports.deleteWebhook = deleteWebhook;
const getWebhookDeliveries = async (req, res) => {
    try {
        const { webhookId } = req.params;
        const userId = req.userId;
        const { limit = '50', offset = '0' } = req.query;
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), MAX_DELIVERY_PAGE_SIZE);
        const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);
        await ensureWebhookOwnership(webhookId, userId);
        const deliveries = await prisma_1.default.webhookDelivery.findMany({
            where: { webhookId },
            orderBy: { deliveredAt: 'desc' },
            take: parsedLimit,
            skip: parsedOffset,
        });
        res.json(deliveries);
    }
    catch (error) {
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
exports.getWebhookDeliveries = getWebhookDeliveries;
const getBotWebhookDeliveries = async (req, res) => {
    try {
        const { botId } = req.params;
        const userId = req.userId;
        const { limit = '30' } = req.query;
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), MAX_DELIVERY_PAGE_SIZE);
        await ensureBotOwnership(botId, userId);
        const deliveries = await prisma_1.default.webhookDelivery.findMany({
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
            take: parsedLimit,
        });
        res.json({ deliveries });
    }
    catch (error) {
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
exports.getBotWebhookDeliveries = getBotWebhookDeliveries;
const testWebhook = async (req, res) => {
    try {
        const { webhookId } = req.params;
        const userId = req.userId;
        const webhook = await ensureWebhookOwnership(webhookId, userId);
        const testPayload = {
            event: 'webhook.test',
            timestamp: new Date().toISOString(),
            data: {
                message: 'This is a test webhook delivery',
            },
        };
        const result = await (0, webhookService_1.deliverWebhook)({
            id: webhook.id,
            url: webhook.url,
            secret: webhook.secret,
        }, 'webhook.test', testPayload);
        res.json({
            success: result.success,
            delivery: result.delivery,
        });
    }
    catch (error) {
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
exports.testWebhook = testWebhook;
const retryDelivery = async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const userId = req.userId;
        const existingDelivery = await prisma_1.default.webhookDelivery.findUnique({
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
        const retried = await (0, webhookService_1.retryWebhookDelivery)(deliveryId);
        res.json(retried);
    }
    catch (error) {
        console.error('Error retrying webhook delivery:', error);
        res.status(500).json({ error: error.message || 'Failed to retry webhook delivery' });
    }
};
exports.retryDelivery = retryDelivery;
const deliverWebhookEvent = async (event, payload) => {
    const webhooks = await prisma_1.default.webhook.findMany({
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
        }
        catch {
            return webhook.events.includes(event);
        }
    });
    await Promise.allSettled(matchingWebhooks.map((webhook) => (0, webhookService_1.deliverWebhook)({
        id: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
    }, event, payload)));
};
exports.deliverWebhookEvent = deliverWebhookEvent;
//# sourceMappingURL=webhookController.js.map