"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildReplyKeyboard = exports.buildInlineKeyboard = exports.revokeChatInviteLink = exports.createChatInviteLink = exports.exportChatInviteLink = exports.promoteChatMember = exports.restrictChatMember = exports.unbanChatMember = exports.kickChatMember = exports.setChatPermissions = exports.getChatMember = exports.getChatMemberCount = exports.getChatAdministrators = exports.deleteMessage = exports.editMessageReplyMarkup = exports.editMessageText = exports.answerInlineQuery = exports.answerCallbackQuery = exports.sendChatAction = exports.parseEntities = void 0;
const enhancedBotService = __importStar(require("../services/enhancedBotService"));
const errorHandlers_1 = require("../utils/errorHandlers");
/**
 * Enhanced Bot API Controller
 * Provides Telegram Bot API-like endpoints for advanced bot functionality
 */
// Parse message entities (mentions, hashtags, commands, URLs)
const parseEntities = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'Text is required');
        }
        const entities = enhancedBotService.parseMessageEntities(text);
        res.json({ ok: true, result: { entities } });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to parse entities');
    }
};
exports.parseEntities = parseEntities;
// Send chat action (typing, upload_photo, etc.)
const sendChatAction = async (req, res) => {
    try {
        const { botId, chatId, action } = req.body;
        if (!botId || !chatId || !action) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'botId, chatId, and action are required');
        }
        const validActions = [
            'typing',
            'upload_photo',
            'record_video',
            'upload_video',
            'record_audio',
            'upload_audio',
            'upload_document',
            'find_location',
            'record_video_note',
            'upload_video_note',
            'choose_sticker',
        ];
        if (!validActions.includes(action)) {
            return (0, errorHandlers_1.handleBadRequest)(res, `Invalid action. Must be one of: ${validActions.join(', ')}`);
        }
        const success = await enhancedBotService.sendChatAction(botId, chatId, action);
        if (!success) {
            return res.json({ ok: false, error_code: 400, description: 'Bot is not active or not found' });
        }
        res.json({ ok: true, result: true });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to send chat action');
    }
};
exports.sendChatAction = sendChatAction;
// Answer callback query (inline button clicks)
const answerCallbackQuery = async (req, res) => {
    try {
        const { botId, callbackQueryId, text, show_alert, url, cache_time } = req.body;
        if (!botId || !callbackQueryId) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'botId and callbackQueryId are required');
        }
        const success = await enhancedBotService.answerCallbackQuery(botId, callbackQueryId, {
            text,
            show_alert,
            url,
            cache_time,
        });
        if (!success) {
            return res.json({ ok: false, error_code: 400, description: 'Bot installation not found' });
        }
        res.json({ ok: true, result: true });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to answer callback query');
    }
};
exports.answerCallbackQuery = answerCallbackQuery;
// Answer inline query
const answerInlineQuery = async (req, res) => {
    try {
        const { botId, inlineQueryId, results, options } = req.body;
        if (!botId || !inlineQueryId || !results) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'botId, inlineQueryId, and results are required');
        }
        const success = await enhancedBotService.answerInlineQuery(botId, inlineQueryId, results, options);
        if (!success) {
            return res.json({ ok: false, error_code: 400, description: 'Bot is not active or not inline' });
        }
        res.json({ ok: true, result: true });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to answer inline query');
    }
};
exports.answerInlineQuery = answerInlineQuery;
// Edit message text
const editMessageText = async (req, res) => {
    try {
        const { botId, messageId, text, parse_mode, entities, reply_markup } = req.body;
        if (!botId || !messageId || !text) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'botId, messageId, and text are required');
        }
        const success = await enhancedBotService.editMessageText(botId, messageId, text, {
            parse_mode,
            entities,
            reply_markup,
        });
        if (!success) {
            return res.json({ ok: false, error_code: 400, description: 'Message not found or bot mismatch' });
        }
        res.json({ ok: true, result: true });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to edit message text');
    }
};
exports.editMessageText = editMessageText;
// Edit message reply markup (keyboard)
const editMessageReplyMarkup = async (req, res) => {
    try {
        const { botId, messageId, reply_markup } = req.body;
        if (!botId || !messageId || !reply_markup) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'botId, messageId, and reply_markup are required');
        }
        const success = await enhancedBotService.editMessageReplyMarkup(botId, messageId, reply_markup);
        if (!success) {
            return res.json({ ok: false, error_code: 400, description: 'Message not found or bot mismatch' });
        }
        res.json({ ok: true, result: true });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to edit message reply markup');
    }
};
exports.editMessageReplyMarkup = editMessageReplyMarkup;
// Delete message
const deleteMessage = async (req, res) => {
    try {
        const { botId, messageId } = req.body;
        if (!botId || !messageId) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'botId and messageId are required');
        }
        const success = await enhancedBotService.deleteMessage(botId, messageId);
        if (!success) {
            return res.json({ ok: false, error_code: 400, description: 'Message not found or bot mismatch' });
        }
        res.json({ ok: true, result: true });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to delete message');
    }
};
exports.deleteMessage = deleteMessage;
// Get chat administrators
const getChatAdministrators = async (req, res) => {
    try {
        const { chatId } = req.body;
        if (!chatId) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'chatId is required');
        }
        const admins = await enhancedBotService.getChatAdministrators(chatId);
        res.json({ ok: true, result: admins });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to get chat administrators');
    }
};
exports.getChatAdministrators = getChatAdministrators;
// Get chat member count
const getChatMemberCount = async (req, res) => {
    try {
        const { chatId } = req.body;
        if (!chatId) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'chatId is required');
        }
        const count = await enhancedBotService.getChatMemberCount(chatId);
        res.json({ ok: true, result: count });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to get chat member count');
    }
};
exports.getChatMemberCount = getChatMemberCount;
// Get chat member
const getChatMember = async (req, res) => {
    try {
        const { chatId, userId } = req.body;
        if (!chatId || !userId) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'chatId and userId are required');
        }
        const member = await enhancedBotService.getChatMember(chatId, userId);
        if (!member) {
            return res.json({ ok: false, error_code: 400, description: 'Member not found' });
        }
        res.json({ ok: true, result: member });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to get chat member');
    }
};
exports.getChatMember = getChatMember;
// Set chat permissions
const setChatPermissions = async (req, res) => {
    try {
        const { chatId, permissions } = req.body;
        if (!chatId || !permissions) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'chatId and permissions are required');
        }
        const success = await enhancedBotService.setChatPermissions(chatId, permissions);
        if (!success) {
            return res.json({ ok: false, error_code: 400, description: 'Chat not found' });
        }
        res.json({ ok: true, result: true });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to set chat permissions');
    }
};
exports.setChatPermissions = setChatPermissions;
// Kick chat member (ban/unban)
const kickChatMember = async (req, res) => {
    try {
        const { chatId, userId, untilDate } = req.body;
        if (!chatId || !userId) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'chatId and userId are required');
        }
        const success = await enhancedBotService.kickChatMember(chatId, userId, untilDate ? new Date(untilDate) : undefined);
        if (!success) {
            return res.json({ ok: false, error_code: 400, description: 'Member not found' });
        }
        res.json({ ok: true, result: true });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to kick chat member');
    }
};
exports.kickChatMember = kickChatMember;
// Unban chat member
const unbanChatMember = async (req, res) => {
    try {
        const { chatId, userId } = req.body;
        if (!chatId || !userId) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'chatId and userId are required');
        }
        const success = await enhancedBotService.unbanChatMember(chatId, userId);
        if (!success) {
            return res.json({ ok: false, error_code: 400, description: 'Member not found or not banned' });
        }
        res.json({ ok: true, result: true });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to unban chat member');
    }
};
exports.unbanChatMember = unbanChatMember;
// Restrict chat member
const restrictChatMember = async (req, res) => {
    try {
        const { chatId, userId, permissions } = req.body;
        if (!chatId || !userId || !permissions) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'chatId, userId, and permissions are required');
        }
        const success = await enhancedBotService.restrictChatMember(chatId, userId, permissions);
        if (!success) {
            return res.json({ ok: false, error_code: 400, description: 'Member not found' });
        }
        res.json({ ok: true, result: true });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to restrict chat member');
    }
};
exports.restrictChatMember = restrictChatMember;
// Promote chat member
const promoteChatMember = async (req, res) => {
    try {
        const { chatId, userId, permissions } = req.body;
        if (!chatId || !userId) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'chatId and userId are required');
        }
        const success = await enhancedBotService.promoteChatMember(chatId, userId, permissions || {});
        if (!success) {
            return res.json({ ok: false, error_code: 400, description: 'Member not found' });
        }
        res.json({ ok: true, result: true });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to promote chat member');
    }
};
exports.promoteChatMember = promoteChatMember;
// Export chat invite link
const exportChatInviteLink = async (req, res) => {
    try {
        const { chatId } = req.body;
        if (!chatId) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'chatId is required');
        }
        const inviteLink = await enhancedBotService.exportChatInviteLink(chatId);
        res.json({ ok: true, result: { inviteLink } });
    }
    catch (error) {
        if (error.message === 'Chat not found') {
            return (0, errorHandlers_1.handleNotFound)(res, 'Chat');
        }
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to export chat invite link');
    }
};
exports.exportChatInviteLink = exportChatInviteLink;
// Create chat invite link
const createChatInviteLink = async (req, res) => {
    try {
        const { chatId, name, expireDate, memberLimit, creates_join_request } = req.body;
        if (!chatId) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'chatId is required');
        }
        const result = await enhancedBotService.createChatInviteLink(chatId, {
            name,
            expireDate: expireDate ? new Date(expireDate) : undefined,
            memberLimit,
            creates_join_request,
        });
        res.json({ ok: true, result });
    }
    catch (error) {
        if (error.message === 'Chat not found') {
            return (0, errorHandlers_1.handleNotFound)(res, 'Chat');
        }
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to create chat invite link');
    }
};
exports.createChatInviteLink = createChatInviteLink;
// Revoke chat invite link
const revokeChatInviteLink = async (req, res) => {
    try {
        const { chatId, inviteCode } = req.body;
        if (!chatId || !inviteCode) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'chatId and inviteCode are required');
        }
        const success = await enhancedBotService.revokeChatInviteLink(chatId, inviteCode);
        if (!success) {
            return res.json({ ok: false, error_code: 400, description: 'Invite link not found' });
        }
        res.json({ ok: true, result: true });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to revoke chat invite link');
    }
};
exports.revokeChatInviteLink = revokeChatInviteLink;
// Build inline keyboard helper
const buildInlineKeyboard = async (req, res) => {
    try {
        const { rows } = req.body;
        if (!rows || !Array.isArray(rows)) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'rows array is required');
        }
        const keyboard = enhancedBotService.buildInlineKeyboard(rows);
        res.json({ ok: true, result: keyboard });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to build inline keyboard');
    }
};
exports.buildInlineKeyboard = buildInlineKeyboard;
// Build reply keyboard helper
const buildReplyKeyboard = async (req, res) => {
    try {
        const { rows, resize, oneTime } = req.body;
        if (!rows || !Array.isArray(rows)) {
            return (0, errorHandlers_1.handleBadRequest)(res, 'rows array is required');
        }
        const keyboard = enhancedBotService.buildReplyKeyboard(rows, {
            resize,
            oneTime,
        });
        res.json({ ok: true, result: keyboard });
    }
    catch (error) {
        (0, errorHandlers_1.handleControllerError)(error, res, 'Failed to build reply keyboard');
    }
};
exports.buildReplyKeyboard = buildReplyKeyboard;
//# sourceMappingURL=enhancedBotController.js.map