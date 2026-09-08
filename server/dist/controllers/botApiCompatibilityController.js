"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.answerInlineQuery = exports.answerCallbackQuery = exports.deleteMessage = exports.editMessageText = exports.sendAudio = exports.sendVideo = exports.sendDocument = exports.sendPhoto = exports.sendMessage = exports.getChatMenuButton = exports.setChatMenuButton = exports.getMyCommands = exports.setMyCommands = exports.getUpdates = exports.getWebhookInfo = exports.deleteWebhook = exports.setWebhook = exports.getMe = void 0;
const botApiCompatibilityService_1 = __importDefault(require("../services/botApiCompatibilityService"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const index_1 = require("../index");
const getToken = (req) => req.params.token;
const handleBotApiError = (error, res) => {
    const message = error instanceof Error ? error.message : 'Bot API request failed';
    const status = message.includes('Invalid bot token')
        ? 401
        : message.includes('not found')
            ? 404
            : 400;
    res.status(status).json({ ok: false, description: message });
};
const getMe = async (req, res) => {
    try {
        res.json(await botApiCompatibilityService_1.default.getMe(getToken(req)));
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.getMe = getMe;
const setWebhook = async (req, res) => {
    try {
        const { url, secret_token: secretToken, allowed_updates: allowedUpdates } = req.body;
        res.json(await botApiCompatibilityService_1.default.setWebhook(getToken(req), url, secretToken, allowedUpdates));
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.setWebhook = setWebhook;
const deleteWebhook = async (req, res) => {
    try {
        const dropPendingUpdates = Boolean(req.body?.drop_pending_updates);
        res.json(await botApiCompatibilityService_1.default.deleteWebhook(getToken(req), dropPendingUpdates));
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.deleteWebhook = deleteWebhook;
const getWebhookInfo = async (req, res) => {
    try {
        res.json(await botApiCompatibilityService_1.default.getWebhookInfo(getToken(req)));
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.getWebhookInfo = getWebhookInfo;
const getUpdates = async (req, res) => {
    try {
        const offset = req.method === 'GET' ? req.query.offset : req.body?.offset;
        const limit = req.method === 'GET' ? req.query.limit : req.body?.limit;
        res.json(await botApiCompatibilityService_1.default.getUpdates(getToken(req), {
            offset: offset !== undefined ? Number(offset) : undefined,
            limit: limit !== undefined ? Number(limit) : undefined,
        }));
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.getUpdates = getUpdates;
const setMyCommands = async (req, res) => {
    try {
        const commands = Array.isArray(req.body?.commands) ? req.body.commands : [];
        res.json(await botApiCompatibilityService_1.default.setMyCommands(getToken(req), commands));
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.setMyCommands = setMyCommands;
const getMyCommands = async (req, res) => {
    try {
        res.json(await botApiCompatibilityService_1.default.getMyCommands(getToken(req)));
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.getMyCommands = getMyCommands;
const setChatMenuButton = async (req, res) => {
    try {
        res.json(await botApiCompatibilityService_1.default.setChatMenuButton(getToken(req), req.body.menu_button || { type: 'default' }));
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.setChatMenuButton = setChatMenuButton;
const getChatMenuButton = async (req, res) => {
    try {
        res.json(await botApiCompatibilityService_1.default.getChatMenuButton(getToken(req)));
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.getChatMenuButton = getChatMenuButton;
const sendMessage = async (req, res) => {
    try {
        const result = await botApiCompatibilityService_1.default.sendMessage(getToken(req), req.body);
        const appMessage = await prisma_1.default.message.findUnique({
            where: { id: String(result.result.message_id) },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                    },
                },
            },
        });
        if (appMessage) {
            index_1.io.to(`chat:${req.body.chat_id}`).emit('message:new', appMessage);
        }
        res.json(result);
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.sendMessage = sendMessage;
const sendPhoto = async (req, res) => {
    try {
        const result = await botApiCompatibilityService_1.default.sendMedia(getToken(req), {
            chat_id: req.body.chat_id,
            mediaUrl: req.body.photo,
            caption: req.body.caption,
            fileName: req.body.file_name,
            type: 'IMAGE',
        });
        const appMessage = await prisma_1.default.message.findUnique({
            where: { id: String(result.result.message_id) },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                    },
                },
            },
        });
        if (appMessage) {
            index_1.io.to(`chat:${req.body.chat_id}`).emit('message:new', appMessage);
        }
        res.json(result);
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.sendPhoto = sendPhoto;
const sendDocument = async (req, res) => {
    try {
        const result = await botApiCompatibilityService_1.default.sendMedia(getToken(req), {
            chat_id: req.body.chat_id,
            mediaUrl: req.body.document,
            caption: req.body.caption,
            fileName: req.body.file_name,
            type: 'FILE',
        });
        const appMessage = await prisma_1.default.message.findUnique({
            where: { id: String(result.result.message_id) },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                    },
                },
            },
        });
        if (appMessage) {
            index_1.io.to(`chat:${req.body.chat_id}`).emit('message:new', appMessage);
        }
        res.json(result);
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.sendDocument = sendDocument;
const sendVideo = async (req, res) => {
    try {
        const result = await botApiCompatibilityService_1.default.sendMedia(getToken(req), {
            chat_id: req.body.chat_id,
            mediaUrl: req.body.video,
            caption: req.body.caption,
            fileName: req.body.file_name,
            type: 'VIDEO',
        });
        const appMessage = await prisma_1.default.message.findUnique({
            where: { id: String(result.result.message_id) },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                    },
                },
            },
        });
        if (appMessage) {
            index_1.io.to(`chat:${req.body.chat_id}`).emit('message:new', appMessage);
        }
        res.json(result);
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.sendVideo = sendVideo;
const sendAudio = async (req, res) => {
    try {
        const result = await botApiCompatibilityService_1.default.sendMedia(getToken(req), {
            chat_id: req.body.chat_id,
            mediaUrl: req.body.audio,
            caption: req.body.caption,
            fileName: req.body.file_name,
            type: 'AUDIO',
        });
        const appMessage = await prisma_1.default.message.findUnique({
            where: { id: String(result.result.message_id) },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                    },
                },
            },
        });
        if (appMessage) {
            index_1.io.to(`chat:${req.body.chat_id}`).emit('message:new', appMessage);
        }
        res.json(result);
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.sendAudio = sendAudio;
const editMessageText = async (req, res) => {
    try {
        const result = await botApiCompatibilityService_1.default.editMessageText(getToken(req), req.body);
        const appMessage = await prisma_1.default.message.findUnique({
            where: { id: String(result.result.message_id) },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                    },
                },
            },
        });
        if (appMessage) {
            index_1.io.to(`chat:${req.body.chat_id}`).emit('message:update', appMessage);
        }
        res.json(result);
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.editMessageText = editMessageText;
const deleteMessage = async (req, res) => {
    try {
        const result = await botApiCompatibilityService_1.default.deleteMessage(getToken(req), req.body);
        index_1.io.to(`chat:${req.body.chat_id}`).emit('message:delete', { messageId: req.body.message_id });
        res.json(result);
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.deleteMessage = deleteMessage;
const answerCallbackQuery = async (req, res) => {
    try {
        const { callback_query_id: callbackQueryId, text } = req.body;
        res.json(await botApiCompatibilityService_1.default.answerCallbackQuery(getToken(req), callbackQueryId, text));
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.answerCallbackQuery = answerCallbackQuery;
const answerInlineQuery = async (req, res) => {
    try {
        const { inline_query_id: inlineQueryId, results } = req.body;
        res.json(await botApiCompatibilityService_1.default.answerInlineQuery(getToken(req), inlineQueryId, Array.isArray(results) ? results : []));
    }
    catch (error) {
        handleBotApiError(error, res);
    }
};
exports.answerInlineQuery = answerInlineQuery;
//# sourceMappingURL=botApiCompatibilityController.js.map