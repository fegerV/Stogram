import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { getBotByToken, sendBotMessage as sendBotMessageService } from '../services/botService';
import internalBotRuntimeService from '../services/internalBotRuntimeService';
import botApiCompatibilityService from '../services/botApiCompatibilityService';
import { io } from '../index';

const getBotTokenFromHeaders = (req: AuthRequest) => {
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

export class BotEnhancedController {
  // Create inline keyboard
  static async createInlineKeyboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { botId } = req.params;
      const { name, buttons } = req.body;
      const userId = req.userId!;

      // Verify bot ownership
      const bot = await prisma.bot.findUnique({
        where: { id: botId },
        select: { ownerId: true },
      });

      if (!bot || bot.ownerId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const keyboard = await prisma.botInlineKeyboard.create({
        data: {
          botId,
          name,
          buttons: JSON.stringify(buttons),
        },
      });

      res.json({ keyboard });
    } catch (error) {
      console.error('Create inline keyboard error:', error);
      res.status(500).json({ error: 'Failed to create inline keyboard' });
    }
  }

  // Get inline keyboards for bot
  static async getInlineKeyboards(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { botId } = req.params;
      const userId = req.userId!;

      // Verify bot ownership
      const bot = await prisma.bot.findUnique({
        where: { id: botId },
        select: { ownerId: true },
      });

      if (!bot || bot.ownerId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const keyboards = await prisma.botInlineKeyboard.findMany({
        where: { botId },
      });

      res.json({
        keyboards: keyboards.map((k: { buttons: string; [key: string]: any }) => ({
          ...k,
          buttons: JSON.parse(k.buttons),
        })),
      });
    } catch (error) {
      console.error('Get inline keyboards error:', error);
      res.status(500).json({ error: 'Failed to get inline keyboards' });
    }
  }

  // Delete inline keyboard
  static async deleteInlineKeyboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { keyboardId } = req.params;
      const userId = req.userId!;

      // Verify ownership through bot
      const keyboard = await prisma.botInlineKeyboard.findUnique({
        where: { id: keyboardId },
        include: { bot: { select: { ownerId: true } } },
      });

      if (!keyboard || keyboard.bot.ownerId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await prisma.botInlineKeyboard.delete({
        where: { id: keyboardId },
      });

      res.json({ success: true, message: 'Keyboard deleted' });
    } catch (error) {
      console.error('Delete inline keyboard error:', error);
      res.status(500).json({ error: 'Failed to delete keyboard' });
    }
  }

  // Handle callback query
  static async handleCallbackQuery(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { botId, messageId, callbackData } = req.body;
      const userId = req.userId!;
      if (!botId || !messageId || !callbackData) {
        res.status(400).json({ error: 'botId, messageId and callbackData are required' });
        return;
      }

      const message = await prisma.message.findUnique({
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

      const messagePreview = message.linkPreview as any;
      if (messagePreview?.kind === 'bot_keyboard' && messagePreview.botId && messagePreview.botId !== botId) {
        res.status(400).json({ error: 'Message is linked to another bot' });
        return;
      }

      // Create callback query record
      const query = await prisma.botCallbackQuery.create({
        data: {
          botId,
          userId,
          messageId,
          callbackData,
        },
      });

      await internalBotRuntimeService.dispatchToBot(botId, 'callback_query.created', {
        query: {
          id: query.id,
          messageId,
          callbackData,
          userId,
          createdAt: query.createdAt.toISOString(),
        },
      });
      await botApiCompatibilityService.publishCallbackQueryUpdate(botId, query.id);

      res.json({ success: true, queryId: query.id });
    } catch (error) {
      console.error('Handle callback query error:', error);
      res.status(500).json({ error: 'Failed to handle callback query' });
    }
  }

  // Answer callback query
  static async answerCallbackQuery(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { queryId } = req.params;
      const { text } = req.body;
      const botToken = getBotTokenFromHeaders(req);

      // Verify bot ownership
      const query = await prisma.botCallbackQuery.findUnique({
        where: { id: queryId },
      });

      if (!query) {
        res.status(404).json({ error: 'Query not found' });
        return;
      }

      const bot = await getBotByToken(botToken);
      if (!bot || bot.id !== query.botId) {
        res.status(403).json({ error: 'Invalid bot token' });
        return;
      }

      await prisma.botCallbackQuery.update({
        where: { id: queryId },
        data: {
          answered: true,
          answerText: text,
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Answer callback query error:', error);
      res.status(500).json({ error: 'Failed to answer callback query' });
    }
  }

  // Handle inline query
  static async handleInlineQuery(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { botId, query, offset } = req.body;
      const userId = req.userId!;
      if (!botId || !query) {
        res.status(400).json({ error: 'botId and query are required' });
        return;
      }

      // Create inline query record
      const inlineQuery = await prisma.botInlineQuery.create({
        data: {
          botId,
          userId,
          query,
          offset,
        },
      });

      await internalBotRuntimeService.dispatchToBot(botId, 'inline_query.created', {
        query: {
          id: inlineQuery.id,
          text: query,
          offset,
          userId,
          createdAt: inlineQuery.createdAt.toISOString(),
        },
      });
      await botApiCompatibilityService.publishInlineQueryUpdate(botId, inlineQuery.id);

      res.json({ success: true, queryId: inlineQuery.id, results: [] });
    } catch (error) {
      console.error('Handle inline query error:', error);
      res.status(500).json({ error: 'Failed to handle inline query' });
    }
  }

  // Answer inline query
  static async answerInlineQuery(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { queryId } = req.params;
      const { results } = req.body;
      const botToken = getBotTokenFromHeaders(req);

      const query = await prisma.botInlineQuery.findUnique({
        where: { id: queryId },
      });

      if (!query) {
        res.status(404).json({ error: 'Query not found' });
        return;
      }

      const bot = await getBotByToken(botToken);
      if (!bot || bot.id !== query.botId) {
        res.status(403).json({ error: 'Invalid bot token' });
        return;
      }

      await prisma.botInlineQuery.update({
        where: { id: queryId },
        data: { answered: true },
      });

      res.json({ success: true, results: Array.isArray(results) ? results : [] });
    } catch (error) {
      console.error('Answer inline query error:', error);
      res.status(500).json({ error: 'Failed to answer inline query' });
    }
  }

  // Send message with inline keyboard
  static async sendMessageWithKeyboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { chatId, content, keyboardId } = req.body;
      const botToken = getBotTokenFromHeaders(req);

      // Verify bot token
      const bot = await getBotByToken(botToken);

      if (!bot) {
        res.status(403).json({ error: 'Invalid bot token' });
        return;
      }

      // Get keyboard
      const keyboard = await prisma.botInlineKeyboard.findUnique({
        where: { id: keyboardId },
      });

      if (!keyboard || keyboard.botId !== bot.id) {
        res.status(404).json({ error: 'Keyboard not found' });
        return;
      }

      let parsedButtons: unknown;
      try {
        parsedButtons = JSON.parse(keyboard.buttons);
      } catch {
        res.status(500).json({ error: 'Keyboard configuration is invalid' });
        return;
      }

      const message = await sendBotMessageService(bot, {
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

      io.to(`chat:${chatId}`).emit('message:new', message);

      res.json({
        success: true,
        message,
      });
    } catch (error) {
      console.error('Send message with keyboard error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  // Get callback queries for bot
  static async getCallbackQueries(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { botId } = req.params;
      const userId = req.userId!;

      // Verify bot ownership
      const bot = await prisma.bot.findUnique({
        where: { id: botId },
        select: { ownerId: true },
      });

      if (!bot || bot.ownerId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const queries = await prisma.botCallbackQuery.findMany({
        where: { botId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      res.json({ queries });
    } catch (error) {
      console.error('Get callback queries error:', error);
      res.status(500).json({ error: 'Failed to get callback queries' });
    }
  }

  // Get inline queries for bot
  static async getInlineQueries(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { botId } = req.params;
      const userId = req.userId!;

      // Verify bot ownership
      const bot = await prisma.bot.findUnique({
        where: { id: botId },
        select: { ownerId: true },
      });

      if (!bot || bot.ownerId !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const queries = await prisma.botInlineQuery.findMany({
        where: { botId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      res.json({ queries });
    } catch (error) {
      console.error('Get inline queries error:', error);
      res.status(500).json({ error: 'Failed to get inline queries' });
    }
  }
}
