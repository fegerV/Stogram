import axios from 'axios';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { sendBotMessage as sendBotMessageService } from './botService';

type Primitive = string | number | boolean | null;
type JsonValue = Primitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

interface BotMethodResponse<T extends JsonValue | JsonObject | JsonValue[]> {
  ok: boolean;
  result: T;
}

interface PendingUpdate {
  update_id: number;
  [key: string]: JsonValue;
}

const BOT_MESSAGE_META = 'bot_meta';
const BOT_KEYBOARD_META = 'bot_keyboard';

class BotApiCompatibilityService {
  private buildUser(user: {
    id: string;
    username?: string | null;
    displayName?: string | null;
  }, isBot = false): JsonObject {
    const result: JsonObject = {
      id: user.id,
      is_bot: isBot,
      first_name: user.displayName || user.username || (isBot ? 'Bot' : 'User'),
    };

    if (user.username) {
      result.username = user.username;
    }

    return result;
  }

  private buildChat(chat: {
    id: string;
    type: string;
    name?: string | null;
  }): JsonObject {
    const result: JsonObject = {
      id: chat.id,
      type: chat.type.toLowerCase(),
    };

    if (chat.name) {
      result.title = chat.name;
    }

    return result;
  }

  private buildBotMessageMeta(botId: string, existingLinkPreview?: unknown, keyboardMeta?: JsonObject) {
    if (keyboardMeta) {
      return keyboardMeta;
    }

    const current = (existingLinkPreview && typeof existingLinkPreview === 'object')
      ? existingLinkPreview as JsonObject
      : {};

    return {
      ...current,
      kind: BOT_MESSAGE_META,
      botId,
    };
  }

  private buildMessagePayload(message: {
    id: string;
    content?: string | null;
    createdAt: Date;
    type: string;
    fileUrl?: string | null;
    fileName?: string | null;
    sender: { id: string; username?: string | null; displayName?: string | null };
    chat: { id: string; type: string; name?: string | null };
    linkPreview?: unknown;
  }): JsonObject {
    const payload: JsonObject = {
      message_id: message.id,
      date: Math.floor(message.createdAt.getTime() / 1000),
      chat: this.buildChat(message.chat),
      from: this.buildUser(message.sender),
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

    const meta = message.linkPreview as JsonObject | null;
    if (meta?.kind === BOT_KEYBOARD_META && Array.isArray(meta.buttons)) {
      payload.reply_markup = {
        inline_keyboard: meta.buttons as JsonValue[],
      };
    }

    return payload;
  }

  private async findBotByToken(token: string) {
    return prisma.bot.findUnique({
      where: { token },
      include: { commands: true },
    });
  }

  private async getNextUpdateId(botId: string) {
    const updatedBot = await prisma.bot.update({
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

  private async persistUpdate(botId: string, updateType: string, updateBody: Omit<PendingUpdate, 'update_id'>) {
    const updateId = await this.getNextUpdateId(botId);
    const update: PendingUpdate = {
      update_id: updateId,
      ...updateBody,
    };

    await prisma.botApiUpdate.create({
      data: {
        botId,
        updateId,
        updateType,
        payload: update as any,
      },
    });

    return update;
  }

  private async deliverWebhook(bot: { webhookUrl: string | null; apiWebhookSecret?: string | null }, update: PendingUpdate) {
    if (!bot.webhookUrl) {
      return;
    }

    await axios.post(bot.webhookUrl, update, {
      headers: {
        'Content-Type': 'application/json',
        ...(bot.apiWebhookSecret ? { 'X-Telegram-Bot-Api-Secret-Token': bot.apiWebhookSecret } : {}),
      },
      timeout: 10000,
    });
  }

  private async getHydratedMessage(messageId: string) {
    return prisma.message.findUnique({
      where: { id: messageId },
      include: {
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

  private async sendBotAppMessage(
    bot: Awaited<ReturnType<BotApiCompatibilityService['findBotByToken']>>,
    payload: {
      chatId: string;
      text?: string;
      type: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO';
      mediaUrl?: string;
      fileName?: string;
      replyMarkup?: { inline_keyboard?: JsonValue[][] };
    }
  ) {
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

    const message = await sendBotMessageService(bot, {
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

  async getBot(token: string) {
    return this.findBotByToken(token);
  }

  async getMe(token: string): Promise<BotMethodResponse<JsonObject>> {
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

  async setWebhook(
    token: string,
    url: string,
    secretToken?: string,
    allowedUpdates?: string[]
  ): Promise<BotMethodResponse<true>> {
    const bot = await this.findBotByToken(token);
    if (!bot) {
      throw new Error('Invalid bot token');
    }

    await prisma.bot.update({
      where: { id: bot.id },
      data: {
        webhookUrl: url || null,
        apiWebhookSecret: secretToken || null,
        apiAllowedUpdates: allowedUpdates?.length ? allowedUpdates as any : null,
      },
    });

    return { ok: true, result: true };
  }

  async deleteWebhook(token: string, dropPendingUpdates = false): Promise<BotMethodResponse<true>> {
    const bot = await this.findBotByToken(token);
    if (!bot) {
      throw new Error('Invalid bot token');
    }

    await prisma.bot.update({
      where: { id: bot.id },
      data: {
        webhookUrl: null,
        apiWebhookSecret: null,
        apiAllowedUpdates: Prisma.JsonNull,
      },
    });

    if (dropPendingUpdates) {
      await prisma.botApiUpdate.updateMany({
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

  async getWebhookInfo(token: string): Promise<BotMethodResponse<JsonObject>> {
    const bot = await this.findBotByToken(token);
    if (!bot) {
      throw new Error('Invalid bot token');
    }

    const pendingCount = await prisma.botApiUpdate.count({
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

  async getUpdates(
    token: string,
    options?: { offset?: number; limit?: number }
  ): Promise<BotMethodResponse<PendingUpdate[]>> {
    const bot = await this.findBotByToken(token);
    if (!bot) {
      throw new Error('Invalid bot token');
    }

    const offset = options?.offset ?? 0;
    const limit = Math.min(options?.limit ?? 100, 100);

    if (offset > 0) {
      await prisma.botApiUpdate.updateMany({
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

    const updates = await prisma.botApiUpdate.findMany({
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
      result: updates.map((item) => item.payload as unknown as PendingUpdate),
    };
  }

  async setMyCommands(
    token: string,
    commands: Array<{ command: string; description: string }>
  ): Promise<BotMethodResponse<true>> {
    const bot = await this.findBotByToken(token);
    if (!bot) {
      throw new Error('Invalid bot token');
    }

    await prisma.$transaction([
      prisma.botCommand.deleteMany({ where: { botId: bot.id } }),
      prisma.botCommand.createMany({
        data: commands.map((command) => ({
          botId: bot.id,
          command: command.command.startsWith('/') ? command.command : `/${command.command}`,
          description: command.description,
        })),
      }),
    ]);

    return { ok: true, result: true };
  }

  async getMyCommands(token: string): Promise<BotMethodResponse<JsonObject[]>> {
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

  async sendMessage(
    token: string,
    payload: {
      chat_id: string;
      text: string;
      reply_markup?: { inline_keyboard?: JsonValue[][] };
    }
  ): Promise<BotMethodResponse<JsonObject>> {
    const bot = await this.findBotByToken(token);
    const message = await this.sendBotAppMessage(bot, {
      chatId: payload.chat_id,
      text: payload.text,
      type: 'TEXT',
      replyMarkup: payload.reply_markup,
    });

    return { ok: true, result: this.buildMessagePayload(message) };
  }

  async sendMedia(
    token: string,
    payload: {
      chat_id: string;
      mediaUrl: string;
      caption?: string;
      fileName?: string;
      type: 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO';
    }
  ): Promise<BotMethodResponse<JsonObject>> {
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

  async editMessageText(
    token: string,
    payload: {
      chat_id: string;
      message_id: string;
      text: string;
      reply_markup?: { inline_keyboard?: JsonValue[][] };
    }
  ): Promise<BotMethodResponse<JsonObject>> {
    const bot = await this.findBotByToken(token);
    if (!bot) {
      throw new Error('Invalid bot token');
    }

    const message = await prisma.message.findUnique({
      where: { id: payload.message_id },
    });

    if (!message || message.chatId !== payload.chat_id) {
      throw new Error('Message not found');
    }

    const meta = this.buildBotMessageMeta(
      bot.id,
      message.linkPreview,
      payload.reply_markup?.inline_keyboard
        ? {
            kind: BOT_KEYBOARD_META,
            botId: bot.id,
            keyboardName: 'Inline keyboard',
            buttons: payload.reply_markup.inline_keyboard,
          }
        : undefined
    );

    await prisma.message.update({
      where: { id: payload.message_id },
      data: {
        content: payload.text,
        isEdited: true,
        linkPreview: meta as any,
      },
    });

    const hydratedMessage = await this.getHydratedMessage(payload.message_id);
    if (!hydratedMessage) {
      throw new Error('Message not found');
    }

    return { ok: true, result: this.buildMessagePayload(hydratedMessage) };
  }

  async deleteMessage(
    token: string,
    payload: { chat_id: string; message_id: string }
  ): Promise<BotMethodResponse<true>> {
    const bot = await this.findBotByToken(token);
    if (!bot) {
      throw new Error('Invalid bot token');
    }

    const message = await prisma.message.findUnique({
      where: { id: payload.message_id },
    });

    if (!message || message.chatId !== payload.chat_id) {
      throw new Error('Message not found');
    }

    await prisma.message.update({
      where: { id: payload.message_id },
      data: {
        isDeleted: true,
        content: 'Message deleted',
      },
    });

    return { ok: true, result: true };
  }

  async answerCallbackQuery(
    token: string,
    callbackQueryId: string,
    text?: string
  ): Promise<BotMethodResponse<true>> {
    const bot = await this.findBotByToken(token);
    if (!bot) {
      throw new Error('Invalid bot token');
    }

    const query = await prisma.botCallbackQuery.findUnique({
      where: { id: callbackQueryId },
    });

    if (!query || query.botId !== bot.id) {
      throw new Error('Callback query not found');
    }

    await prisma.botCallbackQuery.update({
      where: { id: callbackQueryId },
      data: {
        answered: true,
        answerText: text,
      },
    });

    return { ok: true, result: true };
  }

  async answerInlineQuery(
    token: string,
    inlineQueryId: string,
    results: JsonValue[]
  ): Promise<BotMethodResponse<true>> {
    const bot = await this.findBotByToken(token);
    if (!bot) {
      throw new Error('Invalid bot token');
    }

    const query = await prisma.botInlineQuery.findUnique({
      where: { id: inlineQueryId },
    });

    if (!query || query.botId !== bot.id) {
      throw new Error('Inline query not found');
    }

    await prisma.botInlineQuery.update({
      where: { id: inlineQueryId },
      data: {
        answered: true,
        results: results as any,
      },
    });

    return { ok: true, result: true };
  }

  async setChatMenuButton(
    token: string,
    menuButton: JsonObject
  ): Promise<BotMethodResponse<true>> {
    const bot = await this.findBotByToken(token);
    if (!bot) {
      throw new Error('Invalid bot token');
    }

    await prisma.bot.update({
      where: { id: bot.id },
      data: {
        menuButton: menuButton as any,
      },
    });

    return { ok: true, result: true };
  }

  async getChatMenuButton(token: string): Promise<BotMethodResponse<JsonObject>> {
    const bot = await this.findBotByToken(token);
    if (!bot) {
      throw new Error('Invalid bot token');
    }

    return {
      ok: true,
      result: (bot.menuButton as JsonObject | null) || {
        type: 'default',
      },
    };
  }

  async publishMessageUpdate(botId: string, messageId: string, updateField: 'message' | 'edited_message') {
    const [bot, message] = await Promise.all([
      prisma.bot.findUnique({
        where: { id: botId },
        select: {
          webhookUrl: true,
          apiWebhookSecret: true,
        },
      }),
      this.getHydratedMessage(messageId),
    ]);

    if (!bot || !message) {
      return;
    }

    const update = await this.persistUpdate(botId, updateField, {
      [updateField]: this.buildMessagePayload(message),
    });

    await this.deliverWebhook(bot, update);
  }

  async publishCallbackQueryUpdate(botId: string, queryId: string) {
    const [bot, query] = await Promise.all([
      prisma.bot.findUnique({
        where: { id: botId },
        select: {
          webhookUrl: true,
          apiWebhookSecret: true,
        },
      }),
      prisma.botCallbackQuery.findUnique({
        where: { id: queryId },
      }),
    ]);

    if (!bot || !query) {
      return;
    }

    const [user, message] = await Promise.all([
      prisma.user.findUnique({
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

    const update = await this.persistUpdate(botId, 'callback_query', {
      callback_query: {
        id: query.id,
        from: this.buildUser(user),
        chat_instance: message?.chatId || '',
        data: query.callbackData,
        ...(message ? { message: this.buildMessagePayload(message) } : {}),
      },
    });

    await this.deliverWebhook(bot, update);
  }

  async publishInlineQueryUpdate(botId: string, inlineQueryId: string) {
    const [bot, query] = await Promise.all([
      prisma.bot.findUnique({
        where: { id: botId },
        select: {
          webhookUrl: true,
          apiWebhookSecret: true,
        },
      }),
      prisma.botInlineQuery.findUnique({
        where: { id: inlineQueryId },
      }),
    ]);

    if (!bot || !query) {
      return;
    }

    const user = await prisma.user.findUnique({
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

    const update = await this.persistUpdate(botId, 'inline_query', {
      inline_query: {
        id: query.id,
        from: this.buildUser(user),
        query: query.query,
        offset: query.offset || '',
      },
    });

    await this.deliverWebhook(bot, update);
  }
}

export default new BotApiCompatibilityService();
