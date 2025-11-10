import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

      // Create callback query record
      const query = await prisma.botCallbackQuery.create({
        data: {
          botId,
          userId,
          messageId,
          callbackData,
        },
      });

      // Notify bot webhook or handler
      // Implementation depends on bot architecture

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

      // Verify bot ownership
      const query = await prisma.botCallbackQuery.findUnique({
        where: { id: queryId },
      });

      if (!query) {
        res.status(404).json({ error: 'Query not found' });
        return;
      }

      // Get bot to verify token
      const bot = await prisma.bot.findUnique({
        where: { id: query.botId },
        select: { token: true },
      });

      if (!bot) {
        res.status(404).json({ error: 'Bot not found' });
        return;
      }

      // Verify bot token from header
      const botToken = req.headers['token'] as string;
      if (botToken !== bot.token) {
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

      // Create inline query record
      const inlineQuery = await prisma.botInlineQuery.create({
        data: {
          botId,
          userId,
          query,
          offset,
        },
      });

      // Notify bot webhook or handler
      // Return results based on bot's inline handler

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

      // Verify bot token
      const query = await prisma.botInlineQuery.findUnique({
        where: { id: queryId },
      });

      if (!query) {
        res.status(404).json({ error: 'Query not found' });
        return;
      }

      // Get bot to verify token
      const bot = await prisma.bot.findUnique({
        where: { id: query.botId },
        select: { token: true },
      });

      if (!bot) {
        res.status(404).json({ error: 'Bot not found' });
        return;
      }

      const botToken = req.headers['token'] as string;
      if (botToken !== bot.token) {
        res.status(403).json({ error: 'Invalid bot token' });
        return;
      }

      await prisma.botInlineQuery.update({
        where: { id: queryId },
        data: { answered: true },
      });

      // Send results to user
      // Implementation depends on messaging system

      res.json({ success: true });
    } catch (error) {
      console.error('Answer inline query error:', error);
      res.status(500).json({ error: 'Failed to answer inline query' });
    }
  }

  // Send message with inline keyboard
  static async sendMessageWithKeyboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { chatId, content, keyboardId } = req.body;
      const botToken = req.headers['token'] as string;

      // Verify bot token
      const bot = await prisma.bot.findUnique({
        where: { token: botToken },
      });

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

      // Send message (implementation depends on messaging system)
      // Store keyboard buttons with message

      res.json({
        success: true,
        message: 'Message sent with keyboard',
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
