import { Request, Response } from 'express';
import telegramBotService from '../services/telegramBotService';

// Get bot configuration
export const getBotConfig = async (req: Request, res: Response) => {
  try {
    const config = await telegramBotService.getConfig();
    
    if (!config) {
      return res.json({
        botToken: '',
        botUsername: null,
        webhookUrl: null,
        commands: [],
        notifications: true,
        enabled: false,
      });
    }

    res.json({
      botToken: config.botToken ? '***' + config.botToken.slice(-4) : '',
      botUsername: config.botUsername,
      webhookUrl: config.webhookUrl,
      commands: config.commands ? JSON.parse(config.commands) : [],
      notifications: config.notifications,
      enabled: config.enabled,
    });
  } catch (error) {
    console.error('Error getting bot config:', error);
    res.status(500).json({ error: 'Failed to get bot configuration' });
  }
};

// Save bot configuration
export const saveBotConfig = async (req: Request, res: Response) => {
  try {
    const { botToken, botUsername, webhookUrl, commands, notifications, enabled } = req.body;

    // If enabling the bot, validate token
    if (enabled && botToken) {
      // The service will handle initialization
    }

    const config = await telegramBotService.saveConfig({
      botToken,
      botUsername,
      webhookUrl,
      commands,
      notifications,
      enabled,
    });

    res.json(config);
  } catch (error) {
    console.error('Error saving bot config:', error);
    res.status(500).json({ error: 'Failed to save bot configuration' });
  }
};

// Webhook endpoint for Telegram
export const botWebhook = async (req: Request, res: Response) => {
  try {
    const secretToken = req.headers['x-telegram-bot-api-secret-token'];
    if (!telegramBotService.isWebhookRequestAuthorized(secretToken)) {
      return res.status(403).json({ error: 'Invalid webhook secret token' });
    }

    telegramBotService.processWebhookUpdate(req.body);
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Error processing bot webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};

// Get bot stats
export const getBotStats = async (req: Request, res: Response) => {
  try {
    const stats = await telegramBotService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting bot stats:', error);
    res.status(500).json({ error: 'Failed to get bot stats' });
  }
};

// Send message from bot
export const sendBotMessage = async (req: Request, res: Response) => {
  try {
    const { telegramUserId, content } = req.body;

    if (!telegramUserId || !content) {
      return res.status(400).json({ error: 'Telegram user ID and content are required' });
    }

    const success = await telegramBotService.sendMessage(telegramUserId, content);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: 'Failed to send message' });
    }
  } catch (error) {
    console.error('Error sending bot message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get authorized users
export const getBotUsers = async (req: Request, res: Response) => {
  try {
    const users = await telegramBotService.getUsers();
    res.json({ users });
  } catch (error) {
    console.error('Error getting bot users:', error);
    res.status(500).json({ error: 'Failed to get bot users' });
  }
};

// Authorize a user (admin function)
export const authorizeUser = async (req: Request, res: Response) => {
  try {
    const { telegramId, stogramUserId } = req.body;

    if (!telegramId || !stogramUserId) {
      return res.status(400).json({ error: 'Telegram ID and Stogram user ID are required' });
    }

    const user = await telegramBotService.authorizeUser(telegramId, stogramUserId);
    res.json(user);
  } catch (error) {
    console.error('Error authorizing user:', error);
    res.status(500).json({ error: 'Failed to authorize user' });
  }
};

// Broadcast message to all users
export const broadcastMessage = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const count = await telegramBotService.broadcastNotification(message);
    res.json({ success: true, usersNotified: count });
  } catch (error) {
    console.error('Error broadcasting message:', error);
    res.status(500).json({ error: 'Failed to broadcast message' });
  }
};

// Set bot commands
export const setBotCommands = async (req: Request, res: Response) => {
  try {
    const { commands } = req.body;

    if (!Array.isArray(commands)) {
      return res.status(400).json({ error: 'Commands must be an array' });
    }

    const config = await telegramBotService.saveConfig({ commands });
    res.json(config);
  } catch (error) {
    console.error('Error setting bot commands:', error);
    res.status(500).json({ error: 'Failed to set bot commands' });
  }
};

// Test bot connection
export const testBotConnection = async (req: Request, res: Response) => {
  try {
    const { botToken } = req.body;

    if (!botToken) {
      return res.status(400).json({ error: 'Bot token is required' });
    }

    // Try to get bot info using the token
    const TelegramBot = require('node-telegram-bot-api');
    const testBot = new TelegramBot(botToken, { polling: false });
    
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
  } catch (error: any) {
    console.error('Error testing bot connection:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Failed to connect to bot' 
    });
  }
};
