"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testBotConnection = exports.setBotCommands = exports.broadcastMessage = exports.authorizeUser = exports.getBotUsers = exports.sendBotMessage = exports.getBotStats = exports.botWebhook = exports.saveBotConfig = exports.getBotConfig = void 0;
const telegramBotService_1 = __importDefault(require("../services/telegramBotService"));
// Get bot configuration
const getBotConfig = async (req, res) => {
    try {
        const config = await telegramBotService_1.default.getConfig();
        if (!config) {
            return res.json({
                botToken: '',
                hasBotToken: false,
                botUsername: null,
                webhookUrl: null,
                commands: [],
                notifications: true,
                enabled: false,
            });
        }
        res.json({
            botToken: config.botToken ? '***' + config.botToken.slice(-4) : '',
            hasBotToken: Boolean(config.botToken),
            botUsername: config.botUsername,
            webhookUrl: config.webhookUrl,
            commands: config.commands ? JSON.parse(config.commands) : [],
            notifications: config.notifications,
            enabled: config.enabled,
        });
    }
    catch (error) {
        console.error('Error getting bot config:', error);
        res.status(500).json({ error: 'Failed to get bot configuration' });
    }
};
exports.getBotConfig = getBotConfig;
// Save bot configuration
const saveBotConfig = async (req, res) => {
    try {
        const { botToken, botUsername, webhookUrl, commands, notifications, enabled } = req.body;
        // If enabling the bot, validate token
        if (enabled && botToken) {
            // The service will handle initialization
        }
        const config = await telegramBotService_1.default.saveConfig({
            botToken,
            botUsername,
            webhookUrl,
            commands,
            notifications,
            enabled,
        });
        res.json(config);
    }
    catch (error) {
        console.error('Error saving bot config:', error);
        res.status(500).json({ error: 'Failed to save bot configuration' });
    }
};
exports.saveBotConfig = saveBotConfig;
// Webhook endpoint for Telegram
const botWebhook = async (req, res) => {
    try {
        const secretToken = req.headers['x-telegram-bot-api-secret-token'];
        if (!telegramBotService_1.default.isWebhookRequestAuthorized(secretToken)) {
            return res.status(403).json({ error: 'Invalid webhook secret token' });
        }
        telegramBotService_1.default.processWebhookUpdate(req.body);
        res.json({ ok: true });
    }
    catch (error) {
        console.error('Error processing bot webhook:', error);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
};
exports.botWebhook = botWebhook;
// Get bot stats
const getBotStats = async (req, res) => {
    try {
        const stats = await telegramBotService_1.default.getStats();
        res.json(stats);
    }
    catch (error) {
        console.error('Error getting bot stats:', error);
        res.status(500).json({ error: 'Failed to get bot stats' });
    }
};
exports.getBotStats = getBotStats;
// Send message from bot
const sendBotMessage = async (req, res) => {
    try {
        const { telegramUserId, content } = req.body;
        if (!telegramUserId || !content) {
            return res.status(400).json({ error: 'Telegram user ID and content are required' });
        }
        const success = await telegramBotService_1.default.sendMessage(telegramUserId, content);
        if (success) {
            res.json({ success: true });
        }
        else {
            res.status(400).json({ success: false, error: 'Failed to send message' });
        }
    }
    catch (error) {
        console.error('Error sending bot message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};
exports.sendBotMessage = sendBotMessage;
// Get authorized users
const getBotUsers = async (req, res) => {
    try {
        const users = await telegramBotService_1.default.getUsers();
        res.json({ users });
    }
    catch (error) {
        console.error('Error getting bot users:', error);
        res.status(500).json({ error: 'Failed to get bot users' });
    }
};
exports.getBotUsers = getBotUsers;
// Authorize a user (admin function)
const authorizeUser = async (req, res) => {
    try {
        const { telegramId, stogramUserId } = req.body;
        if (!telegramId || !stogramUserId) {
            return res.status(400).json({ error: 'Telegram ID and Stogram user ID are required' });
        }
        const user = await telegramBotService_1.default.authorizeUser(telegramId, stogramUserId);
        res.json(user);
    }
    catch (error) {
        console.error('Error authorizing user:', error);
        res.status(500).json({ error: 'Failed to authorize user' });
    }
};
exports.authorizeUser = authorizeUser;
// Broadcast message to all users
const broadcastMessage = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        const count = await telegramBotService_1.default.broadcastNotification(message);
        res.json({ success: true, usersNotified: count });
    }
    catch (error) {
        console.error('Error broadcasting message:', error);
        res.status(500).json({ error: 'Failed to broadcast message' });
    }
};
exports.broadcastMessage = broadcastMessage;
// Set bot commands
const setBotCommands = async (req, res) => {
    try {
        const { commands } = req.body;
        if (!Array.isArray(commands)) {
            return res.status(400).json({ error: 'Commands must be an array' });
        }
        const config = await telegramBotService_1.default.saveConfig({ commands });
        res.json(config);
    }
    catch (error) {
        console.error('Error setting bot commands:', error);
        res.status(500).json({ error: 'Failed to set bot commands' });
    }
};
exports.setBotCommands = setBotCommands;
// Test bot connection
const testBotConnection = async (req, res) => {
    try {
        const { botToken } = req.body;
        const tokenToTest = typeof botToken === 'string' && botToken.trim()
            ? botToken.trim()
            : undefined;
        if (!tokenToTest) {
            return res.status(400).json({ error: 'Bot token is required' });
        }
        // Try to get bot info using the token
        const TelegramBot = require('node-telegram-bot-api');
        const testBot = new TelegramBot(tokenToTest, { polling: false });
        const botInfo = await testBot.getMe();
        res.json({
            success: true,
            bot: {
                id: botInfo.id,
                username: botInfo.username,
                firstName: botInfo.first_name,
                isBot: botInfo.is_bot,
            }
        });
    }
    catch (error) {
        console.error('Error testing bot connection:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to connect to bot'
        });
    }
};
exports.testBotConnection = testBotConnection;
//# sourceMappingURL=telegramBotController.js.map