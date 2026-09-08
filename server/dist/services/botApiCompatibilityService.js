"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../utils/prisma"));
const botService_1 = require("./botService");
const webhookValidation_1 = require("../utils/webhookValidation");
const BOT_MESSAGE_META = 'bot_meta';
const BOT_KEYBOARD_META = 'bot_keyboard';
class BotApiCompatibilityService {
    async markUpdateConsumed(botId, updateId) {
        await prisma_1.default.botApiUpdate.updateMany({
            where: {
                botId,
                updateId,
                consumedAt: null,
            },
            data: {
                consumedAt: new Date(),
            },
        });
    }
    parseAllowedUpdates(rawAllowedUpdates) {
        if (!Array.isArray(rawAllowedUpdates)) {
            return null;
        }
        const values = rawAllowedUpdates
            .map((value) => (typeof value === 'string' ? value : null))
            .filter((value) => Boolean(value));
        return values.length > 0 ? new Set(values) : null;
    }
    isUpdateAllowed(allowedUpdates, updateType) {
        if (!allowedUpdates || allowedUpdates.has('*')) {
            return true;
        }
        return allowedUpdates.has(updateType);
    }
    buildUser(user, isBot = false) {
        const result = {
            id: user.id,
            is_bot: isBot,
            first_name: user.displayName || user.username || (isBot ? 'Bot' : 'User'),
        };
        if (user.username) {
            result.username = user.username;
        }
        return result;
    }
    buildChat(chat) {
        const result = {
            id: chat.id,
            type: chat.type.toLowerCase(),
        };
        if (chat.name) {
            result.title = chat.name;
        }
        return result;
    }
    buildBotMessageMeta(botId, existingLinkPreview, keyboardMeta) {
        if (keyboardMeta) {
            return keyboardMeta;
        }
        const current = (existingLinkPreview && typeof existingLinkPreview === 'object')
            ? existingLinkPreview
            : {};
        return {
            ...current,
            kind: BOT_MESSAGE_META,
            botId,
        };
    }
    buildMessagePayload(message) {
        const payload = {
            message_id: message.id,
            date: Math.floor(message.createdAt.getTime() / 1000),
            chat: this.buildChat(message.chat),
            from: message.bot
                ? this.buildUser(message.bot, true)
                : this.buildUser(message.sender),
        };
        if (message.content) {
            payload.text = message.content;
            payload.caption = message.content;
        }
        if (message.type === 'IMAGE' && message.fileUrl) {
            payload.photo = [
                {
                    file_id: message.fileUrl,
                    ...(message.fileName ? { file_name: message.fileName } : {}),
                },
            ];
        }
        if (message.type === 'FILE' && message.fileUrl) {
            payload.document = {
                file_id: message.fileUrl,
                ...(message.fileName ? { file_name: message.fileName } : {}),
            };
        }
        if (message.type === 'VIDEO' && message.fileUrl) {
            payload.video = {
                file_id: message.fileUrl,
                ...(message.fileName ? { file_name: message.fileName } : {}),
            };
        }
        if ((message.type === 'AUDIO' || message.type === 'VOICE') && message.fileUrl) {
            payload.audio = {
                file_id: message.fileUrl,
                ...(message.fileName ? { file_name: message.fileName } : {}),
            };
        }
        const meta = message.linkPreview;
        if (meta?.kind === BOT_KEYBOARD_META && Array.isArray(meta.buttons)) {
            payload.reply_markup = {
                inline_keyboard: meta.buttons,
            };
        }
        return payload;
    }
    async findBotByToken(token) {
        return prisma_1.default.bot.findUnique({
            where: { token },
            include: { commands: true },
        });
    }
    async getNextUpdateId(botId) {
        const updatedBot = await prisma_1.default.bot.update({
            where: { id: botId },
            data: {
                lastUpdateId: {
                    increment: 1,
                },
            },
            select: {
                lastUpdateId: true,
            },
        });
        return updatedBot.lastUpdateId;
    }
    async persistUpdate(botId, updateType, updateBody) {
        const updateId = await this.getNextUpdateId(botId);
        const update = {
            update_id: updateId,
            ...updateBody,
        };
        await prisma_1.default.botApiUpdate.create({
            data: {
                botId,
                updateId,
                updateType,
                payload: update,
            },
        });
        return { update, updateId };
    }
    async deliverWebhook(bot, botId, updateId, update) {
        if (!bot.webhookUrl) {
            return;
        }
        await axios_1.default.post(bot.webhookUrl, update, {
            headers: {
                'Content-Type': 'application/json',
                ...(bot.apiWebhookSecret ? { 'X-Telegram-Bot-Api-Secret-Token': bot.apiWebhookSecret } : {}),
            },
            timeout: 10000,
        });
        await this.markUpdateConsumed(botId, updateId);
    }
    async getHydratedMessage(messageId) {
        return prisma_1.default.message.findUnique({
            where: { id: messageId },
            include: {
                bot: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                    },
                },
                sender: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                    },
                },
                chat: {
                    select: {
                        id: true,
                        type: true,
                        name: true,
                    },
                },
            },
        });
    }
    async sendBotAppMessage(bot, payload) {
        if (!bot) {
            throw new Error('Invalid bot token');
        }
        const keyboardMeta = payload.replyMarkup?.inline_keyboard
            ? {
                kind: BOT_KEYBOARD_META,
                botId: bot.id,
                keyboardName: 'Inline keyboard',
                buttons: payload.replyMarkup.inline_keyboard,
            }
            : undefined;
        const message = await (0, botService_1.sendBotMessage)(bot, {
            chatId: payload.chatId,
            content: payload.text,
            type: payload.type,
            fileUrl: payload.mediaUrl,
            fileName: payload.fileName,
            linkPreview: this.buildBotMessageMeta(bot.id, undefined, keyboardMeta),
        });
        const hydratedMessage = await this.getHydratedMessage(message.id);
        if (!hydratedMessage) {
            throw new Error('Failed to load sent message');
        }
        return hydratedMessage;
    }
    async getBot(token) {
        return this.findBotByToken(token);
    }
    async getMe(token) {
        const bot = await this.findBotByToken(token);
        if (!bot) {
            throw new Error('Invalid bot token');
        }
        return {
            ok: true,
            result: {
                id: bot.id,
                is_bot: true,
                username: bot.username,
                first_name: bot.displayName,
                can_join_groups: true,
                supports_inline_queries: bot.isInline,
            },
        };
    }
    async setWebhook(token, url, secretToken, allowedUpdates) {
        const bot = await this.findBotByToken(token);
        if (!bot) {
            throw new Error('Invalid bot token');
        }
        if (url) {
            const urlValidation = (0, webhookValidation_1.validateOutgoingWebhookUrl)(url);
            if (!urlValidation.ok) {
                throw new Error(urlValidation.error);
            }
        }
        await prisma_1.default.bot.update({
            where: { id: bot.id },
            data: {
                webhookUrl: url || null,
                apiWebhookSecret: secretToken || null,
                apiAllowedUpdates: allowedUpdates?.length ? allowedUpdates : null,
            },
        });
        return { ok: true, result: true };
    }
    async deleteWebhook(token, dropPendingUpdates = false) {
        const bot = await this.findBotByToken(token);
        if (!bot) {
            throw new Error('Invalid bot token');
        }
        await prisma_1.default.bot.update({
            where: { id: bot.id },
            data: {
                webhookUrl: null,
                apiWebhookSecret: null,
                apiAllowedUpdates: client_1.Prisma.JsonNull,
            },
        });
        if (dropPendingUpdates) {
            await prisma_1.default.botApiUpdate.updateMany({
                where: {
                    botId: bot.id,
                    consumedAt: null,
                },
                data: {
                    consumedAt: new Date(),
                },
            });
        }
        return { ok: true, result: true };
    }
    async getWebhookInfo(token) {
        const bot = await this.findBotByToken(token);
        if (!bot) {
            throw new Error('Invalid bot token');
        }
        const pendingCount = await prisma_1.default.botApiUpdate.count({
            where: {
                botId: bot.id,
                consumedAt: null,
            },
        });
        return {
            ok: true,
            result: {
                url: bot.webhookUrl || '',
                has_custom_certificate: false,
                pending_update_count: pendingCount,
            },
        };
    }
    async getUpdates(token, options) {
        const bot = await this.findBotByToken(token);
        if (!bot) {
            throw new Error('Invalid bot token');
        }
        if (bot.webhookUrl) {
            throw new Error('Cannot use getUpdates while webhook is active');
        }
        const offset = options?.offset ?? 0;
        const limit = Math.min(options?.limit ?? 100, 100);
        if (offset > 0) {
            await prisma_1.default.botApiUpdate.updateMany({
                where: {
                    botId: bot.id,
                    consumedAt: null,
                    updateId: { lt: offset },
                },
                data: {
                    consumedAt: new Date(),
                },
            });
        }
        const updates = await prisma_1.default.botApiUpdate.findMany({
            where: {
                botId: bot.id,
                consumedAt: null,
                ...(offset > 0 ? { updateId: { gte: offset } } : {}),
            },
            orderBy: { updateId: 'asc' },
            take: limit,
        });
        return {
            ok: true,
            result: updates.map((item) => item.payload),
        };
    }
    async setMyCommands(token, commands) {
        const bot = await this.findBotByToken(token);
        if (!bot) {
            throw new Error('Invalid bot token');
        }
        await prisma_1.default.$transaction([
            prisma_1.default.botCommand.deleteMany({ where: { botId: bot.id } }),
            prisma_1.default.botCommand.createMany({
                data: commands.map((command) => ({
                    botId: bot.id,
                    command: command.command.startsWith('/') ? command.command : `/${command.command}`,
                    description: command.description,
                })),
            }),
        ]);
        return { ok: true, result: true };
    }
    async getMyCommands(token) {
        const bot = await this.findBotByToken(token);
        if (!bot) {
            throw new Error('Invalid bot token');
        }
        return {
            ok: true,
            result: bot.commands.map((command) => ({
                command: command.command.replace(/^\//, ''),
                description: command.description,
            })),
        };
    }
    async sendMessage(token, payload) {
        const bot = await this.findBotByToken(token);
        const message = await this.sendBotAppMessage(bot, {
            chatId: payload.chat_id,
            text: payload.text,
            type: 'TEXT',
            replyMarkup: payload.reply_markup,
        });
        return { ok: true, result: this.buildMessagePayload(message) };
    }
    async sendMedia(token, payload) {
        const bot = await this.findBotByToken(token);
        const message = await this.sendBotAppMessage(bot, {
            chatId: payload.chat_id,
            text: payload.caption,
            type: payload.type,
            mediaUrl: payload.mediaUrl,
            fileName: payload.fileName,
        });
        return { ok: true, result: this.buildMessagePayload(message) };
    }
    async editMessageText(token, payload) {
        const bot = await this.findBotByToken(token);
        if (!bot) {
            throw new Error('Invalid bot token');
        }
        const message = await prisma_1.default.message.findUnique({
            where: { id: payload.message_id },
        });
        if (!message || message.chatId !== payload.chat_id || message.botId !== bot.id) {
            throw new Error('Message not found');
        }
        const meta = this.buildBotMessageMeta(bot.id, message.linkPreview, payload.reply_markup?.inline_keyboard
            ? {
                kind: BOT_KEYBOARD_META,
                botId: bot.id,
                keyboardName: 'Inline keyboard',
                buttons: payload.reply_markup.inline_keyboard,
            }
            : undefined);
        await prisma_1.default.message.update({
            where: { id: payload.message_id },
            data: {
                content: payload.text,
                isEdited: true,
                linkPreview: meta,
            },
        });
        const hydratedMessage = await this.getHydratedMessage(payload.message_id);
        if (!hydratedMessage) {
            throw new Error('Message not found');
        }
        return { ok: true, result: this.buildMessagePayload(hydratedMessage) };
    }
    async deleteMessage(token, payload) {
        const bot = await this.findBotByToken(token);
        if (!bot) {
            throw new Error('Invalid bot token');
        }
        const message = await prisma_1.default.message.findUnique({
            where: { id: payload.message_id },
        });
        if (!message || message.chatId !== payload.chat_id || message.botId !== bot.id) {
            throw new Error('Message not found');
        }
        await prisma_1.default.message.update({
            where: { id: payload.message_id },
            data: {
                isDeleted: true,
                content: 'Message deleted',
            },
        });
        return { ok: true, result: true };
    }
    async answerCallbackQuery(token, callbackQueryId, text) {
        const bot = await this.findBotByToken(token);
        if (!bot) {
            throw new Error('Invalid bot token');
        }
        const query = await prisma_1.default.botCallbackQuery.findUnique({
            where: { id: callbackQueryId },
        });
        if (!query || query.botId !== bot.id) {
            throw new Error('Callback query not found');
        }
        await prisma_1.default.botCallbackQuery.update({
            where: { id: callbackQueryId },
            data: {
                answered: true,
                answerText: text,
            },
        });
        return { ok: true, result: true };
    }
    async answerInlineQuery(token, inlineQueryId, results) {
        const bot = await this.findBotByToken(token);
        if (!bot) {
            throw new Error('Invalid bot token');
        }
        const query = await prisma_1.default.botInlineQuery.findUnique({
            where: { id: inlineQueryId },
        });
        if (!query || query.botId !== bot.id) {
            throw new Error('Inline query not found');
        }
        await prisma_1.default.botInlineQuery.update({
            where: { id: inlineQueryId },
            data: {
                answered: true,
                results: results,
            },
        });
        return { ok: true, result: true };
    }
    async setChatMenuButton(token, menuButton) {
        const bot = await this.findBotByToken(token);
        if (!bot) {
            throw new Error('Invalid bot token');
        }
        await prisma_1.default.bot.update({
            where: { id: bot.id },
            data: {
                menuButton: menuButton,
            },
        });
        return { ok: true, result: true };
    }
    async getChatMenuButton(token) {
        const bot = await this.findBotByToken(token);
        if (!bot) {
            throw new Error('Invalid bot token');
        }
        return {
            ok: true,
            result: bot.menuButton || {
                type: 'default',
            },
        };
    }
    async publishMessageUpdate(botId, messageId, updateField) {
        const [bot, message] = await Promise.all([
            prisma_1.default.bot.findUnique({
                where: { id: botId },
                select: {
                    webhookUrl: true,
                    apiWebhookSecret: true,
                    apiAllowedUpdates: true,
                },
            }),
            this.getHydratedMessage(messageId),
        ]);
        if (!bot || !message) {
            return;
        }
        const allowedUpdates = this.parseAllowedUpdates(bot.apiAllowedUpdates);
        if (!this.isUpdateAllowed(allowedUpdates, updateField)) {
            return;
        }
        const { update, updateId } = await this.persistUpdate(botId, updateField, {
            [updateField]: this.buildMessagePayload(message),
        });
        await this.deliverWebhook(bot, botId, updateId, update);
    }
    async publishCallbackQueryUpdate(botId, queryId) {
        const [bot, query] = await Promise.all([
            prisma_1.default.bot.findUnique({
                where: { id: botId },
                select: {
                    webhookUrl: true,
                    apiWebhookSecret: true,
                    apiAllowedUpdates: true,
                },
            }),
            prisma_1.default.botCallbackQuery.findUnique({
                where: { id: queryId },
            }),
        ]);
        if (!bot || !query) {
            return;
        }
        const allowedUpdates = this.parseAllowedUpdates(bot.apiAllowedUpdates);
        if (!this.isUpdateAllowed(allowedUpdates, 'callback_query')) {
            return;
        }
        const [user, message] = await Promise.all([
            prisma_1.default.user.findUnique({
                where: { id: query.userId },
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                },
            }),
            this.getHydratedMessage(query.messageId),
        ]);
        if (!user) {
            return;
        }
        const { update, updateId } = await this.persistUpdate(botId, 'callback_query', {
            callback_query: {
                id: query.id,
                from: this.buildUser(user),
                chat_instance: message?.chatId || '',
                data: query.callbackData,
                ...(message ? { message: this.buildMessagePayload(message) } : {}),
            },
        });
        await this.deliverWebhook(bot, botId, updateId, update);
    }
    async publishInlineQueryUpdate(botId, inlineQueryId) {
        const [bot, query] = await Promise.all([
            prisma_1.default.bot.findUnique({
                where: { id: botId },
                select: {
                    webhookUrl: true,
                    apiWebhookSecret: true,
                    apiAllowedUpdates: true,
                },
            }),
            prisma_1.default.botInlineQuery.findUnique({
                where: { id: inlineQueryId },
            }),
        ]);
        if (!bot || !query) {
            return;
        }
        const allowedUpdates = this.parseAllowedUpdates(bot.apiAllowedUpdates);
        if (!this.isUpdateAllowed(allowedUpdates, 'inline_query')) {
            return;
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: query.userId },
            select: {
                id: true,
                username: true,
                displayName: true,
            },
        });
        if (!user) {
            return;
        }
        const { update, updateId } = await this.persistUpdate(botId, 'inline_query', {
            inline_query: {
                id: query.id,
                from: this.buildUser(user),
                query: query.query,
                offset: query.offset || '',
            },
        });
        await this.deliverWebhook(bot, botId, updateId, update);
    }
}
exports.default = new BotApiCompatibilityService();
//# sourceMappingURL=botApiCompatibilityService.js.map