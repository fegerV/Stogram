import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { handleControllerError, handleNotFound, handleUnauthorized, handleForbidden, handleBadRequest } from '../utils/errorHandlers';
import { generateBotToken, sendBotMessage as sendBotMessageService, getBotByToken } from '../services/botService';

// Создать нового бота
export const createBot = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { username, displayName, description, avatar, isInline } = req.body;

    if (!username || !displayName) {
      return res.status(400).json({ error: 'Username and displayName are required' });
    }

    const token = generateBotToken();

    const bot = await prisma.bot.create({
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
  } catch (error: any) {
    console.error('Error creating bot:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Bot with this username already exists' });
    }
    res.status(500).json({ error: 'Failed to create bot' });
  }
};

// Получить все боты пользователя
export const getUserBots = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const bots = await prisma.bot.findMany({
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
  } catch (error) {
    console.error('Error fetching bots:', error);
    res.status(500).json({ error: 'Failed to fetch bots' });
  }
};

// Получить информацию о боте
export const getBot = async (req: AuthRequest, res: Response) => {
  try {
    const { botId } = req.params;

    const bot = await prisma.bot.findUnique({
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
  } catch (error) {
    console.error('Error fetching bot:', error);
    res.status(500).json({ error: 'Failed to fetch bot' });
  }
};

// Обновить бота
export const updateBot = async (req: AuthRequest, res: Response) => {
  try {
    const { botId } = req.params;
    const userId = req.userId!;
    const { displayName, description, avatar, isActive, webhookUrl } = req.body;

    const bot = await prisma.bot.findUnique({
      where: { id: botId }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    if (bot.ownerId !== userId) {
      return res.status(403).json({ error: 'You can only update your own bots' });
    }

    const updatedBot = await prisma.bot.update({
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
  } catch (error) {
    console.error('Error updating bot:', error);
    res.status(500).json({ error: 'Failed to update bot' });
  }
};

// Удалить бота
export const deleteBot = async (req: AuthRequest, res: Response) => {
  try {
    const { botId } = req.params;
    const userId = req.userId!;

    const bot = await prisma.bot.findUnique({
      where: { id: botId }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    if (bot.ownerId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own bots' });
    }

    await prisma.bot.delete({
      where: { id: botId }
    });

    res.json({ message: 'Bot deleted successfully' });
  } catch (error) {
    console.error('Error deleting bot:', error);
    res.status(500).json({ error: 'Failed to delete bot' });
  }
};

// Добавить команду к боту
export const addBotCommand = async (req: AuthRequest, res: Response) => {
  try {
    const { botId } = req.params;
    const { command, description } = req.body;

    if (!command || !description) {
      return res.status(400).json({ error: 'Command and description are required' });
    }

    const botCommand = await prisma.botCommand.create({
      data: {
        botId,
        command: command.startsWith('/') ? command : `/${command}`,
        description
      }
    });

    res.status(201).json(botCommand);
  } catch (error: any) {
    console.error('Error adding bot command:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This command already exists for this bot' });
    }
    res.status(500).json({ error: 'Failed to add bot command' });
  }
};

// Удалить команду бота
export const deleteBotCommand = async (req: AuthRequest, res: Response) => {
  try {
    const { commandId } = req.params;

    await prisma.botCommand.delete({
      where: { id: commandId }
    });

    res.json({ message: 'Bot command deleted successfully' });
  } catch (error) {
    console.error('Error deleting bot command:', error);
    res.status(500).json({ error: 'Failed to delete bot command' });
  }
};

// Регенерировать токен бота
export const regenerateBotToken = async (req: AuthRequest, res: Response) => {
  try {
    const { botId } = req.params;
    const userId = req.userId!;

    const bot = await prisma.bot.findUnique({
      where: { id: botId }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    if (bot.ownerId !== userId) {
      return res.status(403).json({ error: 'You can only regenerate tokens for your own bots' });
    }

    const newToken = generateBotToken();

    const updatedBot = await prisma.bot.update({
      where: { id: botId },
      data: { token: newToken }
    });

    res.json({ token: newToken });
  } catch (error) {
    console.error('Error regenerating bot token:', error);
    res.status(500).json({ error: 'Failed to regenerate bot token' });
  }
};

// Отправить сообщение от имени бота
export const sendBotMessage = async (req: any, res: any) => {
  try {
    const { token } = req.headers;
    const { chatId, content, type, fileUrl, fileName, fileSize, thumbnailUrl } = req.body;

    if (!token) {
      return handleUnauthorized(res, 'Bot token is required');
    }

    const bot = await getBotByToken(token as string);

    if (!bot || !bot.isActive) {
      return handleUnauthorized(res, 'Invalid or inactive bot token');
    }

    // Use the bot service to send the message
    // This properly handles bot message creation with validation
    const message = await sendBotMessageService(bot, {
      chatId,
      content,
      type: type || 'TEXT',
      fileUrl,
      fileName,
      fileSize,
      thumbnailUrl
    });

    res.status(201).json(message);
  } catch (error: any) {
    if (error.message === 'Chat not found or bot owner is not a member') {
      return handleForbidden(res, error.message);
    }
    if (error.message === 'Bot is not active') {
      return handleBadRequest(res, error.message);
    }
    handleControllerError(error, res, 'Failed to send bot message');
  }
};
