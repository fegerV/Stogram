import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import telegramService from '../services/telegramService';

const prisma = new PrismaClient();

export const telegramController = {
  // Webhook для получения обновлений от Telegram
  webhook: async (req: Request, res: Response) => {
    try {
      const update = req.body;
      telegramService.processWebhookUpdate(update);
      res.sendStatus(200);
    } catch (error) {
      console.error('Telegram webhook error:', error);
      res.sendStatus(500);
    }
  },

  // Авторизация через Telegram Login Widget
  authTelegram: async (req: Request, res: Response) => {
    try {
      const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;

      // Верификация данных от Telegram
      if (!telegramService.verifyTelegramAuth(req.body)) {
        return res.status(400).json({ error: 'Invalid authentication data' });
      }

      // Проверить, не истекла ли авторизация (должна быть не старше 24 часов)
      const authTimestamp = parseInt(auth_date);
      const now = Math.floor(Date.now() / 1000);
      if (now - authTimestamp > 86400) {
        return res.status(400).json({ error: 'Authentication data expired' });
      }

      // Найти существующего пользователя по telegram ID
      let user = await prisma.user.findFirst({
        where: { telegramId: id }
      });

      if (!user && req.user) {
        // Если пользователь уже авторизован в Stogram, связать аккаунт
        user = await telegramService.linkTelegramAccount(req.user.id, {
          id,
          first_name,
          last_name,
          username,
          photo_url,
          auth_date: authTimestamp
        });
      } else if (!user) {
        // Создать новый аккаунт на основе Telegram данных
        const email = `telegram_${id}@stogram.local`;
        const usernameToUse = username || `tg_${id}`;
        
        user = await prisma.user.create({
          data: {
            email,
            username: usernameToUse,
            password: '', // Пароль не требуется для Telegram входа
            displayName: first_name + (last_name ? ` ${last_name}` : ''),
            avatar: photo_url,
            emailVerified: true,
            telegramId: id,
            telegramUsername: username,
            telegramFirstName: first_name,
            telegramLastName: last_name,
            telegramPhotoUrl: photo_url,
            telegramAuthDate: new Date(authTimestamp * 1000),
            telegramNotifications: true,
          }
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          telegramLinked: true
        }
      });
    } catch (error) {
      console.error('Telegram auth error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  },

  // Связать Telegram аккаунт с текущим пользователем
  linkAccount: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id, first_name, last_name, username, photo_url, auth_date } = req.body;

      if (!telegramService.verifyTelegramAuth(req.body)) {
        return res.status(400).json({ error: 'Invalid authentication data' });
      }

      // Проверить, не связан ли уже этот Telegram аккаунт
      const existingUser = await prisma.user.findFirst({
        where: { telegramId: id }
      });

      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ 
          error: 'This Telegram account is already linked to another user' 
        });
      }

      const user = await telegramService.linkTelegramAccount(req.user.id, {
        id,
        first_name,
        last_name,
        username,
        photo_url,
        auth_date: parseInt(auth_date)
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          telegramLinked: true,
          telegramUsername: user.telegramUsername
        }
      });
    } catch (error) {
      console.error('Link account error:', error);
      res.status(500).json({ error: 'Failed to link account' });
    }
  },

  // Отвязать Telegram аккаунт
  unlinkAccount: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      await telegramService.unlinkTelegramAccount(req.user.id);

      res.json({ success: true, message: 'Telegram account unlinked' });
    } catch (error) {
      console.error('Unlink account error:', error);
      res.status(500).json({ error: 'Failed to unlink account' });
    }
  },

  // Получить настройки Telegram интеграции
  getSettings: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          telegramId: true,
          telegramUsername: true,
          telegramFirstName: true,
          telegramLastName: true,
          telegramPhotoUrl: true,
          telegramNotifications: true,
          telegramSyncMessages: true,
          telegramSyncProfile: true,
          telegramBridges: {
            where: { isActive: true },
            select: {
              id: true,
              stogramChatId: true,
              telegramChatId: true,
              syncDirection: true,
              lastSyncAt: true,
              createdAt: true
            }
          }
        }
      });

      res.json({
        linked: !!user?.telegramId,
        telegram: user ? {
          id: user.telegramId,
          username: user.telegramUsername,
          firstName: user.telegramFirstName,
          lastName: user.telegramLastName,
          photoUrl: user.telegramPhotoUrl,
          notifications: user.telegramNotifications,
          syncMessages: user.telegramSyncMessages,
          syncProfile: user.telegramSyncProfile,
          bridges: user.telegramBridges
        } : null,
        botInfo: telegramService.getBotInfo()
      });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Failed to get settings' });
    }
  },

  // Обновить настройки
  updateSettings: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { notifications, syncMessages, syncProfile } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          telegramNotifications: notifications,
          telegramSyncMessages: syncMessages,
          telegramSyncProfile: syncProfile
        }
      });

      res.json({
        success: true,
        settings: {
          notifications: user.telegramNotifications,
          syncMessages: user.telegramSyncMessages,
          syncProfile: user.telegramSyncProfile
        }
      });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  },

  // Создать мост для чата
  createBridge: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { stogramChatId, telegramChatId, telegramChatType, syncDirection } = req.body;

      if (!stogramChatId || !telegramChatId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Проверить, что пользователь является членом чата
      const chatMember = await prisma.chatMember.findFirst({
        where: {
          userId: req.user.id,
          chatId: stogramChatId
        }
      });

      if (!chatMember) {
        return res.status(403).json({ error: 'You are not a member of this chat' });
      }

      // Проверить, не существует ли уже мост
      const existingBridge = await prisma.telegramChatBridge.findFirst({
        where: {
          stogramChatId,
          telegramChatId
        }
      });

      if (existingBridge) {
        return res.status(400).json({ error: 'Bridge already exists' });
      }

      const bridge = await telegramService.createChatBridge(
        req.user.id,
        stogramChatId,
        telegramChatId,
        telegramChatType || 'private',
        syncDirection || 'BIDIRECTIONAL'
      );

      res.json({ success: true, bridge });
    } catch (error) {
      console.error('Create bridge error:', error);
      res.status(500).json({ error: 'Failed to create bridge' });
    }
  },

  // Удалить мост
  deleteBridge: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { bridgeId } = req.params;

      // Проверить, что мост принадлежит пользователю
      const bridge = await prisma.telegramChatBridge.findFirst({
        where: {
          id: bridgeId,
          userId: req.user.id
        }
      });

      if (!bridge) {
        return res.status(404).json({ error: 'Bridge not found' });
      }

      await telegramService.removeChatBridge(bridgeId);

      res.json({ success: true, message: 'Bridge deleted' });
    } catch (error) {
      console.error('Delete bridge error:', error);
      res.status(500).json({ error: 'Failed to delete bridge' });
    }
  },

  // Переключить активность моста
  toggleBridge: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { bridgeId } = req.params;
      const { isActive } = req.body;

      // Проверить, что мост принадлежит пользователю
      const bridge = await prisma.telegramChatBridge.findFirst({
        where: {
          id: bridgeId,
          userId: req.user.id
        }
      });

      if (!bridge) {
        return res.status(404).json({ error: 'Bridge not found' });
      }

      const updatedBridge = await telegramService.toggleChatBridge(bridgeId, isActive);

      res.json({ success: true, bridge: updatedBridge });
    } catch (error) {
      console.error('Toggle bridge error:', error);
      res.status(500).json({ error: 'Failed to toggle bridge' });
    }
  },

  // Telegram Mini App - валидация и создание сессии
  miniAppAuth: async (req: Request, res: Response) => {
    try {
      const { initData, initDataUnsafe } = req.body;

      if (!initData || !initDataUnsafe) {
        return res.status(400).json({ error: 'Missing required data' });
      }

      // Валидация данных
      const isValid = await telegramService.validateMiniAppData(initData);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid init data' });
      }

      const telegramUser = initDataUnsafe.user;
      if (!telegramUser) {
        return res.status(400).json({ error: 'User data not found' });
      }

      // Найти пользователя по Telegram ID
      let user = await prisma.user.findFirst({
        where: { telegramId: telegramUser.id.toString() }
      });

      if (!user) {
        // Создать нового пользователя
        const email = `telegram_${telegramUser.id}@stogram.local`;
        const username = telegramUser.username || `tg_${telegramUser.id}`;
        
        user = await prisma.user.create({
          data: {
            email,
            username,
            password: '',
            displayName: telegramUser.first_name + (telegramUser.last_name ? ` ${telegramUser.last_name}` : ''),
            emailVerified: true,
            telegramId: telegramUser.id.toString(),
            telegramUsername: telegramUser.username,
            telegramFirstName: telegramUser.first_name,
            telegramLastName: telegramUser.last_name,
            telegramNotifications: true,
          }
        });
      }

      // Создать сессию Mini App
      const session = await telegramService.createMiniAppSession(
        user.id,
        telegramUser.id.toString(),
        initData,
        initDataUnsafe
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt
        }
      });
    } catch (error) {
      console.error('Mini app auth error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  },

  // Отправить тестовое уведомление
  sendTestNotification: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user?.telegramId) {
        return res.status(400).json({ error: 'Telegram account not linked' });
      }

      const success = await telegramService.sendNotification(
        user.telegramId,
        '🔔 Тестовое уведомление от Stogram!\n\nЕсли вы получили это сообщение, уведомления работают корректно.'
      );

      if (success) {
        res.json({ success: true, message: 'Test notification sent' });
      } else {
        res.status(500).json({ error: 'Failed to send notification' });
      }
    } catch (error) {
      console.error('Send test notification error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  }
};
