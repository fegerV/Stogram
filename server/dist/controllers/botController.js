"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uninstallBot = exports.installBot = exports.listBotInstallations = exports.sendBotMessage = exports.regenerateBotToken = exports.deleteBotCommand = exports.addBotCommand = exports.deleteBot = exports.updateBot = exports.getBot = exports.getUserBots = exports.createBot = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const errorHandlers_1 = require("../utils/errorHandlers");
const botService_1 = require("../services/botService");
const index_1 = require("../index");
// Создать нового бота
const createBot = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { username, displayName, description, avatar, isInline } = req.body;
        if (!username || !displayName) {
            return res.status(400).json({ error: 'Username and displayName are required' });
        }
        const token = (0, botService_1.generateBotToken)();
        const bot = await prisma_1.default.bot.create({
            data: {
                username,
                displayName,
                description,
                avatar,
                token,
                isInline: isInline ?? false,
                ownerId: userId
            }
        });
        res.status(201).json(bot);
    }
    catch (error) {
        console.error('Error creating bot:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Bot with this username already exists' });
        }
        res.status(500).json({ error: 'Failed to create bot' });
    }
};
exports.createBot = createBot;
// Получить все боты пользователя
const getUserBots = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const bots = await prisma_1.default.bot.findMany({
            where: { ownerId: userId },
            include: {
                commands: true,
                webhooks: {
                    where: { isActive: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(bots);
    }
    catch (error) {
        console.error('Error fetching bots:', error);
        res.status(500).json({ error: 'Failed to fetch bots' });
    }
};
exports.getUserBots = getUserBots;
// Получить информацию о боте
const getBot = async (req, res) => {
    try {
        const { botId } = req.params;
        const userId = req.userId;
        const bot = await prisma_1.default.bot.findUnique({
            where: { id: botId },
            include: {
                commands: true
            }
        });
        if (!bot) {
            return res.status(404).json({ error: 'Bot not found' });
        }
        // Скрываем токен для безопасности
        const { token, ...botData } = bot;
        res.json(botData);
    }
    catch (error) {
        console.error('Error fetching bot:', error);
        res.status(500).json({ error: 'Failed to fetch bot' });
    }
};
exports.getBot = getBot;
// Обновить бота
const updateBot = async (req, res) => {
    try {
        const { botId } = req.params;
        const userId = req.userId;
        const { displayName, description, avatar, isActive, webhookUrl } = req.body;
        const bot = await prisma_1.default.bot.findUnique({
            where: { id: botId }
        });
        if (!bot) {
            return res.status(404).json({ error: 'Bot not found' });
        }
        if (bot.ownerId !== userId) {
            return res.status(403).json({ error: 'You can only update your own bots' });
        }
        const updatedBot = await prisma_1.default.bot.update({
            where: { id: botId },
            data: {
                displayName,
                description,
                avatar,
                isActive,
                webhookUrl
            }
        });
        res.json(updatedBot);
    }
    catch (error) {
        console.error('Error updating bot:', error);
        res.status(500).json({ error: 'Failed to update bot' });
    }
};
exports.updateBot = updateBot;
// Удалить бота
const deleteBot = async (req, res) => {
    try {
        const { botId } = req.params;
        const userId = req.userId;
        const bot = await prisma_1.default.bot.findUnique({
            where: { id: botId }
        });
        if (!bot) {
            return res.status(404).json({ error: 'Bot not found' });
        }
        if (bot.ownerId !== userId) {
            return res.status(403).json({ error: 'You can only delete your own bots' });
        }
        await prisma_1.default.bot.delete({
            where: { id: botId }
        });
        res.json({ message: 'Bot deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting bot:', error);
        res.status(500).json({ error: 'Failed to delete bot' });
    }
};
exports.deleteBot = deleteBot;
// Добавить команду к боту
const addBotCommand = async (req, res) => {
    try {
        const { botId } = req.params;
        const userId = req.userId;
        const { command, description } = req.body;
        if (!command || !description) {
            return res.status(400).json({ error: 'Command and description are required' });
        }
        const bot = await prisma_1.default.bot.findUnique({
            where: { id: botId },
            select: { id: true, ownerId: true }
        });
        if (!bot) {
            return res.status(404).json({ error: 'Bot not found' });
        }
        if (bot.ownerId !== userId) {
            return res.status(403).json({ error: 'You can only view your own bots' });
        }
        if (bot.ownerId !== userId) {
            return res.status(403).json({ error: 'You can only manage commands for your own bots' });
        }
        const botCommand = await prisma_1.default.botCommand.create({
            data: {
                botId,
                command: command.startsWith('/') ? command : `/${command}`,
                description
            }
        });
        res.status(201).json(botCommand);
    }
    catch (error) {
        console.error('Error adding bot command:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'This command already exists for this bot' });
        }
        res.status(500).json({ error: 'Failed to add bot command' });
    }
};
exports.addBotCommand = addBotCommand;
// Удалить команду бота
const deleteBotCommand = async (req, res) => {
    try {
        const { commandId } = req.params;
        const userId = req.userId;
        const command = await prisma_1.default.botCommand.findUnique({
            where: { id: commandId },
            include: {
                bot: {
                    select: { ownerId: true }
                }
            }
        });
        if (!command) {
            return res.status(404).json({ error: 'Bot command not found' });
        }
        if (command.bot.ownerId !== userId) {
            return res.status(403).json({ error: 'You can only manage commands for your own bots' });
        }
        await prisma_1.default.botCommand.delete({
            where: { id: commandId }
        });
        res.json({ message: 'Bot command deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting bot command:', error);
        res.status(500).json({ error: 'Failed to delete bot command' });
    }
};
exports.deleteBotCommand = deleteBotCommand;
// Регенерировать токен бота
const regenerateBotToken = async (req, res) => {
    try {
        const { botId } = req.params;
        const userId = req.userId;
        const bot = await prisma_1.default.bot.findUnique({
            where: { id: botId }
        });
        if (!bot) {
            return res.status(404).json({ error: 'Bot not found' });
        }
        if (bot.ownerId !== userId) {
            return res.status(403).json({ error: 'You can only regenerate tokens for your own bots' });
        }
        const newToken = (0, botService_1.generateBotToken)();
        const updatedBot = await prisma_1.default.bot.update({
            where: { id: botId },
            data: { token: newToken }
        });
        res.json({ token: newToken });
    }
    catch (error) {
        console.error('Error regenerating bot token:', error);
        res.status(500).json({ error: 'Failed to regenerate bot token' });
    }
};
exports.regenerateBotToken = regenerateBotToken;
// Отправить сообщение от имени бота
const sendBotMessage = async (req, res) => {
    try {
        const { token } = req.headers;
        const { chatId, content, type, fileUrl, fileName, fileSize, thumbnailUrl } = req.body;
        if (!token) {
            return (0, errorHandlers_1.handleUnauthorized)(res, 'Bot token is required');
        }
        const bot = await (0, botService_1.getBotByToken)(token);
        if (!bot || !bot.isActive) {
            return (0, errorHandlers_1.handleUnauthorized)(res, 'Invalid or inactive bot token');
        }
        // Use the bot service to send the message
        // This properly handles bot message creation with validation
        const message = await (0, botService_1.sendBotMessage)(bot, {
            chatId,
            content,
            type: type || 'TEXT',
            fileUrl,
            fileName,
            fileSize,
            thumbnailUrl
        });
        index_1.io.to(`chat:${chatId}`).emit('message:new', message);
        res.status(201).json(message);
    }
    catch (error) {
        if (error.message === 'Bot is not installed in this chat') {
            return (0, errorHandlers_1.handleForbidden)(res, error.message);
        }
        if (error.message === 'Bot is not active') {
            return (0, errorHandlers_1.handleBadRequest)(res, error.message);
        }
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to send bot message');
    }
};
exports.sendBotMessage = sendBotMessage;
const listBotInstallations = async (req, res) => {
    try {
        const { botId } = req.params;
        const userId = req.userId;
        const installations = await (0, botService_1.getBotInstallations)(botId, userId);
        res.json({ installations });
    }
    catch (error) {
        if (error.message === 'Bot not found') {
            return (0, errorHandlers_1.handleNotFound)(res, 'Bot');
        }
        if (error.message === 'You can only view your own bots') {
            return (0, errorHandlers_1.handleForbidden)(res, error.message);
        }
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to fetch bot installations');
    }
};
exports.listBotInstallations = listBotInstallations;
const installBot = async (req, res) => {
    try {
        const { botId } = req.params;
        const userId = req.userId;
        const { chatId } = req.body;
        if (!chatId) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'chatId is required');
        }
        const installation = await (0, botService_1.installBotInChat)(botId, userId, chatId);
        res.status(201).json({ installation });
    }
    catch (error) {
        if (error.message === 'Bot not found') {
            return (0, errorHandlers_1.handleNotFound)(res, 'Bot');
        }
        if (error.message === 'You can only install your own bots'
            || error.message === 'You are not a member of this chat') {
            return (0, errorHandlers_1.handleForbidden)(res, error.message);
        }
        if (error.message === 'Bot is not active') {
            return (0, errorHandlers_1.handleBadRequest)(res, error.message);
        }
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to install bot');
    }
};
exports.installBot = installBot;
const uninstallBot = async (req, res) => {
    try {
        const { botId, chatId } = req.params;
        const userId = req.userId;
        await (0, botService_1.uninstallBotFromChat)(botId, userId, chatId);
        res.json({ message: 'Bot removed from chat' });
    }
    catch (error) {
        if (error.message === 'Bot not found') {
            return (0, errorHandlers_1.handleNotFound)(res, 'Bot');
        }
        if (error.message === 'You can only manage your own bots'
            || error.message === 'Bot is not installed in this chat') {
            return (0, errorHandlers_1.handleForbidden)(res, error.message);
        }
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to uninstall bot');
    }
};
exports.uninstallBot = uninstallBot;
//# sourceMappingURL=botController.js.map