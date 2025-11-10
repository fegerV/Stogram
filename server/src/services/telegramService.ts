import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto';
import prisma from '../utils/prisma';

class TelegramService {
  private bot: TelegramBot | null = null;
  private botToken: string | undefined;
  private botUsername: string | undefined;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.botUsername = process.env.TELEGRAM_BOT_USERNAME;

    if (this.botToken) {
      this.initializeBot();
    }
  }

  private initializeBot() {
    if (!this.botToken) return;

    const useWebhook = process.env.TELEGRAM_USE_WEBHOOK === 'true';
    
    if (useWebhook) {
      this.bot = new TelegramBot(this.botToken, { webHook: true });
      const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
      if (webhookUrl) {
        this.bot.setWebHook(webhookUrl);
      }
    } else {
      this.bot = new TelegramBot(this.botToken, { polling: true });
    }

    this.setupBotHandlers();
  }

  private setupBotHandlers() {
    if (!this.bot) return;

    // Команда /start
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramUserId = msg.from?.id.toString();

      if (!telegramUserId) return;

      const user = await prisma.user.findFirst({
        where: { telegramId: telegramUserId }
      });

      if (user) {
        await this.bot?.sendMessage(
          chatId,
          `👋 Добро пожаловать, ${user.displayName || user.username}!\n\n` +
          `Вы уже связали свой аккаунт Stogram с Telegram.\n\n` +
          `Доступные команды:\n` +
          `/status - Проверить статус аккаунта\n` +
          `/notifications - Управление уведомлениями\n` +
          `/bridge - Создать мост для чата\n` +
          `/help - Помощь`
        );
      } else {
        await this.bot?.sendMessage(
          chatId,
          `👋 Добро пожаловать в Stogram Bot!\n\n` +
          `Для начала работы, пожалуйста, свяжите свой аккаунт через веб-приложение Stogram.\n\n` +
          `Используйте Telegram Login на странице настроек.`
        );
      }
    });

    // Команда /status
    this.bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramUserId = msg.from?.id.toString();

      if (!telegramUserId) return;

      const user = await prisma.user.findFirst({
        where: { telegramId: telegramUserId },
        include: {
          telegramBridges: {
            where: { isActive: true }
          }
        }
      });

      if (!user) {
        await this.bot?.sendMessage(
          chatId,
          `❌ Аккаунт не связан. Пожалуйста, выполните вход через Telegram Login.`
        );
        return;
      }

      const activeBridges = user.telegramBridges.length;

      await this.bot?.sendMessage(
        chatId,
        `📊 Статус аккаунта\n\n` +
        `👤 Пользователь: ${user.displayName || user.username}\n` +
        `📧 Email: ${user.email}\n` +
        `🔗 Активных мостов: ${activeBridges}\n` +
        `🔔 Уведомления: ${user.telegramNotifications ? '✅ Включены' : '❌ Отключены'}\n` +
        `🔄 Синхронизация сообщений: ${user.telegramSyncMessages ? '✅ Включена' : '❌ Отключена'}`
      );
    });

    // Команда /notifications
    this.bot.onText(/\/notifications (on|off)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const telegramUserId = msg.from?.id.toString();
      const action = match?.[1];

      if (!telegramUserId || !action) return;

      const user = await prisma.user.findFirst({
        where: { telegramId: telegramUserId }
      });

      if (!user) {
        await this.bot?.sendMessage(
          chatId,
          `❌ Аккаунт не связан.`
        );
        return;
      }

      const enabled = action === 'on';
      await prisma.user.update({
        where: { id: user.id },
        data: { telegramNotifications: enabled }
      });

      await this.bot?.sendMessage(
        chatId,
        `🔔 Уведомления ${enabled ? 'включены' : 'отключены'}`
      );
    });

    // Команда /bridge
    this.bot.onText(/\/bridge/, async (msg) => {
      const chatId = msg.chat.id;
      await this.bot?.sendMessage(
        chatId,
        `🌉 Создание моста для чатов\n\n` +
        `Для создания моста между Telegram чатом и Stogram:\n` +
        `1. Добавьте этого бота в группу Telegram\n` +
        `2. Используйте веб-интерфейс Stogram для настройки моста\n` +
        `3. Выберите чат Stogram для синхронизации\n\n` +
        `После настройки все сообщения будут автоматически синхронизироваться.`
      );
    });

    // Команда /help
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      await this.bot?.sendMessage(
        chatId,
        `📚 Помощь по командам\n\n` +
        `/start - Начать работу с ботом\n` +
        `/status - Проверить статус аккаунта\n` +
        `/notifications on|off - Управление уведомлениями\n` +
        `/bridge - Информация о мостах для чатов\n` +
        `/help - Показать эту справку\n\n` +
        `Для полной функциональности используйте веб-приложение Stogram.`
      );
    });

    // Обработка входящих сообщений для мостов
    this.bot.on('message', async (msg) => {
      if (msg.text?.startsWith('/')) return; // Пропустить команды

      const telegramChatId = msg.chat.id.toString();
      const telegramUserId = msg.from?.id.toString();

      if (!telegramUserId) return;

      // Найти активный мост для этого чата
      const bridge = await prisma.telegramChatBridge.findFirst({
        where: {
          telegramChatId,
          isActive: true,
          syncDirection: {
            in: ['TELEGRAM_TO_STOGRAM', 'BIDIRECTIONAL']
          }
        },
        include: {
          user: true
        }
      });

      if (bridge && msg.text) {
        await this.syncMessageToStogram(bridge, msg);
      }
    });
  }

  async sendNotification(
    telegramUserId: string,
    message: string,
    options?: TelegramBot.SendMessageOptions
  ): Promise<boolean> {
    if (!this.bot) {
      console.error('Telegram bot not initialized');
      return false;
    }

    try {
      await this.bot.sendMessage(telegramUserId, message, {
        parse_mode: 'Markdown',
        ...options
      });
      return true;
    } catch (error) {
      console.error('Telegram notification error:', error);
      return false;
    }
  }

  verifyTelegramAuth(data: any): boolean {
    if (!this.botToken) return false;

    const secret = crypto
      .createHash('sha256')
      .update(this.botToken)
      .digest();

    const { hash, ...items } = data;
    const dataCheckString = Object.keys(items)
      .sort()
      .map(k => `${k}=${items[k]}`)
      .join('\n');

    const hmac = crypto
      .createHmac('sha256', secret)
      .update(dataCheckString)
      .digest('hex');

    return hmac === hash;
  }

  async linkTelegramAccount(
    userId: string,
    telegramData: {
      id: string;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      auth_date: number;
    }
  ) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        telegramId: telegramData.id,
        telegramUsername: telegramData.username,
        telegramFirstName: telegramData.first_name,
        telegramLastName: telegramData.last_name,
        telegramPhotoUrl: telegramData.photo_url,
        telegramAuthDate: new Date(telegramData.auth_date * 1000),
        telegramNotifications: true,
      }
    });
  }

  async unlinkTelegramAccount(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        telegramId: null,
        telegramUsername: null,
        telegramFirstName: null,
        telegramLastName: null,
        telegramPhotoUrl: null,
        telegramAuthDate: null,
        telegramNotifications: false,
        telegramSyncMessages: false,
        telegramSyncProfile: false,
      }
    });
  }

  async createChatBridge(
    userId: string,
    stogramChatId: string,
    telegramChatId: string,
    telegramChatType: string,
    syncDirection: 'TELEGRAM_TO_STOGRAM' | 'STOGRAM_TO_TELEGRAM' | 'BIDIRECTIONAL' = 'BIDIRECTIONAL'
  ) {
    return await prisma.telegramChatBridge.create({
      data: {
        userId,
        stogramChatId,
        telegramChatId,
        telegramChatType,
        syncDirection,
        isActive: true
      }
    });
  }

  async removeChatBridge(bridgeId: string) {
    return await prisma.telegramChatBridge.delete({
      where: { id: bridgeId }
    });
  }

  async toggleChatBridge(bridgeId: string, isActive: boolean) {
    return await prisma.telegramChatBridge.update({
      where: { id: bridgeId },
      data: { isActive }
    });
  }

  async syncMessageToStogram(bridge: any, telegramMessage: TelegramBot.Message) {
    try {
      // Проверить, не было ли это сообщение уже синхронизировано
      const existingSync = await prisma.telegramMessageSync.findUnique({
        where: {
          bridgeId_telegramMessageId: {
            bridgeId: bridge.id,
            telegramMessageId: telegramMessage.message_id.toString()
          }
        }
      });

      if (existingSync) return;

      // Создать сообщение в Stogram
      const message = await prisma.message.create({
        data: {
          content: telegramMessage.text || '',
          type: 'TEXT',
          senderId: bridge.userId,
          chatId: bridge.stogramChatId,
          isSent: true
        }
      });

      // Сохранить синхронизацию
      await prisma.telegramMessageSync.create({
        data: {
          bridgeId: bridge.id,
          stogramMessageId: message.id,
          telegramMessageId: telegramMessage.message_id.toString(),
          direction: 'TELEGRAM_TO_STOGRAM'
        }
      });

      // Обновить время последней синхронизации
      await prisma.telegramChatBridge.update({
        where: { id: bridge.id },
        data: { lastSyncAt: new Date() }
      });

      return message;
    } catch (error) {
      console.error('Error syncing message to Stogram:', error);
      throw error;
    }
  }

  async syncMessageToTelegram(
    bridgeId: string,
    stogramMessage: any
  ) {
    try {
      const bridge = await prisma.telegramChatBridge.findUnique({
        where: { id: bridgeId }
      });

      if (!bridge || !bridge.isActive) {
        throw new Error('Bridge not found or inactive');
      }

      if (
        bridge.syncDirection !== 'STOGRAM_TO_TELEGRAM' &&
        bridge.syncDirection !== 'BIDIRECTIONAL'
      ) {
        return;
      }

      // Проверить, не было ли это сообщение уже синхронизировано
      const existingSync = await prisma.telegramMessageSync.findFirst({
        where: {
          bridgeId: bridge.id,
          stogramMessageId: stogramMessage.id
        }
      });

      if (existingSync) return;

      // Отправить сообщение в Telegram
      const sentMessage = await this.bot?.sendMessage(
        bridge.telegramChatId,
        stogramMessage.content || ''
      );

      if (sentMessage) {
        // Сохранить синхронизацию
        await prisma.telegramMessageSync.create({
          data: {
            bridgeId: bridge.id,
            stogramMessageId: stogramMessage.id,
            telegramMessageId: sentMessage.message_id.toString(),
            direction: 'STOGRAM_TO_TELEGRAM'
          }
        });

        // Обновить время последней синхронизации
        await prisma.telegramChatBridge.update({
          where: { id: bridge.id },
          data: { lastSyncAt: new Date() }
        });
      }

      return sentMessage;
    } catch (error) {
      console.error('Error syncing message to Telegram:', error);
      throw error;
    }
  }

  async createMiniAppSession(
    userId: string,
    telegramUserId: string,
    initData: string,
    initDataUnsafe: any
  ) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 часа

    return await prisma.telegramMiniAppSession.create({
      data: {
        userId,
        telegramUserId,
        initData,
        initDataUnsafe: JSON.stringify(initDataUnsafe),
        queryId: initDataUnsafe.query_id,
        platform: initDataUnsafe.platform,
        version: initDataUnsafe.version,
        isActive: true,
        expiresAt
      }
    });
  }

  async validateMiniAppData(initData: string): Promise<boolean> {
    if (!this.botToken) return false;

    try {
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      urlParams.delete('hash');

      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      const secret = crypto
        .createHmac('sha256', 'WebAppData')
        .update(this.botToken)
        .digest();

      const calculatedHash = crypto
        .createHmac('sha256', secret)
        .update(dataCheckString)
        .digest('hex');

      return hash === calculatedHash;
    } catch (error) {
      console.error('Error validating mini app data:', error);
      return false;
    }
  }

  processWebhookUpdate(update: TelegramBot.Update) {
    if (!this.bot) return;
    this.bot.processUpdate(update);
  }

  getBotInfo() {
    return {
      username: this.botUsername,
      isInitialized: this.bot !== null
    };
  }
}

export default new TelegramService();
