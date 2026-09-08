"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotEnhancedController = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const botService_1 = require("../services/botService");
const internalBotRuntimeService_1 = __importDefault(require("../services/internalBotRuntimeService"));
const botApiCompatibilityService_1 = __importDefault(require("../services/botApiCompatibilityService"));
const index_1 = require("../index");
const getBotTokenFromHeaders = (req) => {
    const headerValue = req.headers['token'];
    if (typeof headerValue === 'string' && headerValue.trim()) {
        return headerValue.trim();
    }
    const authorization = req.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
        return authorization.slice('Bearer '.length).trim();
    }
    return '';
};
class BotEnhancedController {
    // Create inline keyboard
    static async createInlineKeyboard(req, res) {
        try {
            const { botId } = req.params;
            const { name, buttons } = req.body;
            const userId = req.userId;
            // Verify bot ownership
            const bot = await prisma_1.default.bot.findUnique({
                where: { id: botId },
                select: { ownerId: true },
            });
            if (!bot || bot.ownerId !== userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
            const keyboard = await prisma_1.default.botInlineKeyboard.create({
                data: {
                    botId,
                    name,
                    buttons: JSON.stringify(buttons),
                },
            });
            res.json({ keyboard });
        }
        catch (error) {
            console.error('Create inline keyboard error:', error);
            res.status(500).json({ error: 'Failed to create inline keyboard' });
        }
    }
    // Get inline keyboards for bot
    static async getInlineKeyboards(req, res) {
        try {
            const { botId } = req.params;
            const userId = req.userId;
            // Verify bot ownership
            const bot = await prisma_1.default.bot.findUnique({
                where: { id: botId },
                select: { ownerId: true },
            });
            if (!bot || bot.ownerId !== userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
            const keyboards = await prisma_1.default.botInlineKeyboard.findMany({
                where: { botId },
            });
            res.json({
                keyboards: keyboards.map((k) => ({
                    ...k,
                    buttons: JSON.parse(k.buttons),
                })),
            });
        }
        catch (error) {
            console.error('Get inline keyboards error:', error);
            res.status(500).json({ error: 'Failed to get inline keyboards' });
        }
    }
    // Delete inline keyboard
    static async deleteInlineKeyboard(req, res) {
        try {
            const { keyboardId } = req.params;
            const userId = req.userId;
            // Verify ownership through bot
            const keyboard = await prisma_1.default.botInlineKeyboard.findUnique({
                where: { id: keyboardId },
                include: { bot: { select: { ownerId: true } } },
            });
            if (!keyboard || keyboard.bot.ownerId !== userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
            await prisma_1.default.botInlineKeyboard.delete({
                where: { id: keyboardId },
            });
            res.json({ success: true, message: 'Keyboard deleted' });
        }
        catch (error) {
            console.error('Delete inline keyboard error:', error);
            res.status(500).json({ error: 'Failed to delete keyboard' });
        }
    }
    // Handle callback query
    static async handleCallbackQuery(req, res) {
        try {
            const { botId, messageId, callbackData } = req.body;
            const userId = req.userId;
            if (!botId || !messageId || !callbackData) {
                res.status(400).json({ error: 'botId, messageId and callbackData are required' });
                return;
            }
            const message = await prisma_1.default.message.findUnique({
                where: { id: messageId },
                include: {
                    chat: {
                        include: {
                            members: true,
                        },
                    },
                },
            });
            if (!message) {
                res.status(404).json({ error: 'Message not found' });
                return;
            }
            const hasAccess = message.chat.members.some((member) => member.userId === userId);
            if (!hasAccess) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
            const messagePreview = message.linkPreview;
            if (messagePreview?.kind === 'bot_keyboard' && messagePreview.botId && messagePreview.botId !== botId) {
                res.status(400).json({ error: 'Message is linked to another bot' });
                return;
            }
            // Create callback query record
            const query = await prisma_1.default.botCallbackQuery.create({
                data: {
                    botId,
                    userId,
                    messageId,
                    callbackData,
                },
            });
            await internalBotRuntimeService_1.default.dispatchToBot(botId, 'callback_query.created', {
                query: {
                    id: query.id,
                    messageId,
                    callbackData,
                    userId,
                    createdAt: query.createdAt.toISOString(),
                },
            });
            await botApiCompatibilityService_1.default.publishCallbackQueryUpdate(botId, query.id);
            res.json({ success: true, queryId: query.id });
        }
        catch (error) {
            console.error('Handle callback query error:', error);
            res.status(500).json({ error: 'Failed to handle callback query' });
        }
    }
    // Answer callback query
    static async answerCallbackQuery(req, res) {
        try {
            const { queryId } = req.params;
            const { text } = req.body;
            const botToken = getBotTokenFromHeaders(req);
            // Verify bot ownership
            const query = await prisma_1.default.botCallbackQuery.findUnique({
                where: { id: queryId },
            });
            if (!query) {
                res.status(404).json({ error: 'Query not found' });
                return;
            }
            const bot = await (0, botService_1.getBotByToken)(botToken);
            if (!bot || bot.id !== query.botId) {
                res.status(403).json({ error: 'Invalid bot token' });
                return;
            }
            await prisma_1.default.botCallbackQuery.update({
                where: { id: queryId },
                data: {
                    answered: true,
                    answerText: text,
                },
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error('Answer callback query error:', error);
            res.status(500).json({ error: 'Failed to answer callback query' });
        }
    }
    // Handle inline query
    static async handleInlineQuery(req, res) {
        try {
            const { botId, query, offset } = req.body;
            const userId = req.userId;
            if (!botId || !query) {
                res.status(400).json({ error: 'botId and query are required' });
                return;
            }
            // Create inline query record
            const inlineQuery = await prisma_1.default.botInlineQuery.create({
                data: {
                    botId,
                    userId,
                    query,
                    offset,
                },
            });
            await internalBotRuntimeService_1.default.dispatchToBot(botId, 'inline_query.created', {
                query: {
                    id: inlineQuery.id,
                    text: query,
                    offset,
                    userId,
                    createdAt: inlineQuery.createdAt.toISOString(),
                },
            });
            await botApiCompatibilityService_1.default.publishInlineQueryUpdate(botId, inlineQuery.id);
            res.json({ success: true, queryId: inlineQuery.id, results: [] });
        }
        catch (error) {
            console.error('Handle inline query error:', error);
            res.status(500).json({ error: 'Failed to handle inline query' });
        }
    }
    // Answer inline query
    static async answerInlineQuery(req, res) {
        try {
            const { queryId } = req.params;
            const { results } = req.body;
            const botToken = getBotTokenFromHeaders(req);
            const query = await prisma_1.default.botInlineQuery.findUnique({
                where: { id: queryId },
            });
            if (!query) {
                res.status(404).json({ error: 'Query not found' });
                return;
            }
            const bot = await (0, botService_1.getBotByToken)(botToken);
            if (!bot || bot.id !== query.botId) {
                res.status(403).json({ error: 'Invalid bot token' });
                return;
            }
            await prisma_1.default.botInlineQuery.update({
                where: { id: queryId },
                data: { answered: true },
            });
            res.json({ success: true, results: Array.isArray(results) ? results : [] });
        }
        catch (error) {
            console.error('Answer inline query error:', error);
            res.status(500).json({ error: 'Failed to answer inline query' });
        }
    }
    // Send message with inline keyboard
    static async sendMessageWithKeyboard(req, res) {
        try {
            const { chatId, content, keyboardId } = req.body;
            const botToken = getBotTokenFromHeaders(req);
            // Verify bot token
            const bot = await (0, botService_1.getBotByToken)(botToken);
            if (!bot) {
                res.status(403).json({ error: 'Invalid bot token' });
                return;
            }
            // Get keyboard
            const keyboard = await prisma_1.default.botInlineKeyboard.findUnique({
                where: { id: keyboardId },
            });
            if (!keyboard || keyboard.botId !== bot.id) {
                res.status(404).json({ error: 'Keyboard not found' });
                return;
            }
            let parsedButtons;
            try {
                parsedButtons = JSON.parse(keyboard.buttons);
            }
            catch {
                res.status(500).json({ error: 'Keyboard configuration is invalid' });
                return;
            }
            const message = await (0, botService_1.sendBotMessage)(bot, {
                chatId,
                content,
                type: 'TEXT',
                linkPreview: {
                    kind: 'bot_keyboard',
                    botId: bot.id,
                    keyboardId: keyboard.id,
                    keyboardName: keyboard.name,
                    buttons: parsedButtons,
                },
            });
            index_1.io.to(`chat:${chatId}`).emit('message:new', message);
            res.json({
                success: true,
                message,
            });
        }
        catch (error) {
            console.error('Send message with keyboard error:', error);
            res.status(500).json({ error: 'Failed to send message' });
        }
    }
    // Get callback queries for bot
    static async getCallbackQueries(req, res) {
        try {
            const { botId } = req.params;
            const userId = req.userId;
            // Verify bot ownership
            const bot = await prisma_1.default.bot.findUnique({
                where: { id: botId },
                select: { ownerId: true },
            });
            if (!bot || bot.ownerId !== userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
            const queries = await prisma_1.default.botCallbackQuery.findMany({
                where: { botId },
                orderBy: { createdAt: 'desc' },
                take: 100,
            });
            res.json({ queries });
        }
        catch (error) {
            console.error('Get callback queries error:', error);
            res.status(500).json({ error: 'Failed to get callback queries' });
        }
    }
    // Get inline queries for bot
    static async getInlineQueries(req, res) {
        try {
            const { botId } = req.params;
            const userId = req.userId;
            // Verify bot ownership
            const bot = await prisma_1.default.bot.findUnique({
                where: { id: botId },
                select: { ownerId: true },
            });
            if (!bot || bot.ownerId !== userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
            const queries = await prisma_1.default.botInlineQuery.findMany({
                where: { botId },
                orderBy: { createdAt: 'desc' },
                take: 100,
            });
            res.json({ queries });
        }
        catch (error) {
            console.error('Get inline queries error:', error);
            res.status(500).json({ error: 'Failed to get inline queries' });
        }
    }
}
exports.BotEnhancedController = BotEnhancedController;
//# sourceMappingURL=botEnhancedController.js.map