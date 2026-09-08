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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBotInstallations = exports.uninstallBotFromChat = exports.installBotInChat = exports.validateBotChatAccess = exports.sendBotMessage = exports.getBotByToken = exports.generateBotToken = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const crypto = __importStar(require("crypto"));
const generateBotToken = () => {
    return crypto.randomBytes(32).toString('hex');
};
exports.generateBotToken = generateBotToken;
const getBotByToken = async (token) => {
    return await prisma_1.default.bot.findUnique({
        where: { token },
        include: { commands: true }
    });
};
exports.getBotByToken = getBotByToken;
/**
 * Send a message on behalf of a bot.
 * This creates a bot-sent message that appears in the chat.
 * The message is associated with the bot owner's user account but can be tracked as a bot message.
 */
const sendBotMessage = async (bot, options) => {
    if (!bot.isActive) {
        throw new Error('Bot is not active');
    }
    const { chatId, content, type = 'TEXT', fileUrl, fileName, fileSize, thumbnailUrl } = options;
    const { linkPreview } = options;
    const installation = await prisma_1.default.botChatInstallation.findFirst({
        where: {
            botId: bot.id,
            chatId,
            isActive: true,
        },
    });
    if (!installation) {
        throw new Error('Bot is not installed in this chat');
    }
    const message = await prisma_1.default.message.create({
        data: {
            content: content || '',
            type,
            senderId: bot.ownerId,
            botId: bot.id,
            chatId,
            fileUrl,
            fileName,
            fileSize,
            thumbnailUrl,
            linkPreview: linkPreview,
            isSent: true,
        },
        include: {
            sender: {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                }
            },
            bot: true,
        }
    });
    // Update chat timestamp
    await prisma_1.default.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
    });
    return message;
};
exports.sendBotMessage = sendBotMessage;
/**
 * Validate bot permissions for a specific chat
 */
const validateBotChatAccess = async (botOwnerId, chatId) => {
    const membership = await prisma_1.default.chatMember.findFirst({
        where: {
            userId: botOwnerId,
            chatId
        }
    });
    return !!membership;
};
exports.validateBotChatAccess = validateBotChatAccess;
const installBotInChat = async (botId, userId, chatId) => {
    const bot = await prisma_1.default.bot.findUnique({
        where: { id: botId },
        select: {
            id: true,
            ownerId: true,
            isActive: true,
        },
    });
    if (!bot) {
        throw new Error('Bot not found');
    }
    if (bot.ownerId !== userId) {
        throw new Error('You can only install your own bots');
    }
    if (!bot.isActive) {
        throw new Error('Bot is not active');
    }
    const membership = await prisma_1.default.chatMember.findFirst({
        where: {
            chatId,
            userId,
        },
    });
    if (!membership) {
        throw new Error('You are not a member of this chat');
    }
    return prisma_1.default.botChatInstallation.upsert({
        where: {
            botId_chatId: {
                botId,
                chatId,
            },
        },
        update: {
            isActive: true,
            installedBy: userId,
        },
        create: {
            botId,
            chatId,
            installedBy: userId,
            isActive: true,
        },
        include: {
            chat: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                    avatar: true,
                },
            },
        },
    });
};
exports.installBotInChat = installBotInChat;
const uninstallBotFromChat = async (botId, userId, chatId) => {
    const bot = await prisma_1.default.bot.findUnique({
        where: { id: botId },
        select: {
            id: true,
            ownerId: true,
        },
    });
    if (!bot) {
        throw new Error('Bot not found');
    }
    if (bot.ownerId !== userId) {
        throw new Error('You can only manage your own bots');
    }
    const installation = await prisma_1.default.botChatInstallation.findUnique({
        where: {
            botId_chatId: {
                botId,
                chatId,
            },
        },
    });
    if (!installation) {
        throw new Error('Bot is not installed in this chat');
    }
    return prisma_1.default.botChatInstallation.update({
        where: {
            botId_chatId: {
                botId,
                chatId,
            },
        },
        data: {
            isActive: false,
        },
    });
};
exports.uninstallBotFromChat = uninstallBotFromChat;
const getBotInstallations = async (botId, userId) => {
    const bot = await prisma_1.default.bot.findUnique({
        where: { id: botId },
        select: {
            id: true,
            ownerId: true,
        },
    });
    if (!bot) {
        throw new Error('Bot not found');
    }
    if (bot.ownerId !== userId) {
        throw new Error('You can only view your own bots');
    }
    return prisma_1.default.botChatInstallation.findMany({
        where: {
            botId,
            isActive: true,
        },
        include: {
            chat: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                    avatar: true,
                    updatedAt: true,
                },
            },
        },
        orderBy: {
            updatedAt: 'desc',
        },
    });
};
exports.getBotInstallations = getBotInstallations;
//# sourceMappingURL=botService.js.map