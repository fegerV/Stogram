import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto';
import prisma from '../utils/prisma';

interface BotCommand {
  command: string;
  description: string;
  handler: (msg: TelegramBot.Message, match?: RegExpMatchArray) => Promise<void>;
}

class TelegramBotService {
  private bot: TelegramBot | null = null;
  private config: any = null;
  private commands: BotCommand[] = [];

  async initialize() {
    await this.loadConfig();
    if (this.config?.enabled && this.config?.botToken) {
      this.initializeBot();
    }
  }

  private async loadConfig() {
    this.config = await prisma.telegramBotConfig.findFirst();
  }

  private initializeBot() {
    if (!this.config?.botToken) return;

    const useWebhook = !!this.config.webhookUrl;
    
    if (useWebhook) {
      this.bot = new TelegramBot(this.config.botToken, { webHook: true });
      if (this.config.webhookUrl) {
        this.bot.setWebHook(this.config.webhookUrl);
      }
    } else {
      this.bot = new TelegramBot(this.config.botToken, { polling: true });
    }

    this.setupCommands();
    this.setupHandlers();
  }

  private setupCommands() {
    const commandsConfig = this.config?.commands 
      ? JSON.parse(this.config.commands) 
      : [
          { command: 'start', description: 'Start the bot' },
          { command: 'help', description: 'Show help information' },
          { command: 'status', description: 'Check account status' },
          { command: 'chats', description: 'List your chats' },
          { command: 'unread', description: 'Show unread messages' },
          { command: 'search', description: 'Search messages' },
          { command: 'notify', description: 'Manage notifications' },
          { command: 'connect', description: 'Connect Stogram account' },
          { command: 'disconnect', description: 'Disconnect account' },
        ];

    if (this.bot) {
      this.bot.setMyCommands(commandsConfig);
    }

    this.commands = [
      {
        command: 'start',
        description: 'Start the bot',
        handler: this.handleStart.bind(this),
      },
      {
        command: 'help',
        description: 'Show help information',
        handler: this.handleHelp.bind(this),
      },
      {
        command: 'status',
        description: 'Check account status',
        handler: this.handleStatus.bind(this),
      },
      {
        command: 'chats',
        description: 'List your chats',
        handler: this.handleChats.bind(this),
      },
      {
        command: 'unread',
        description: 'Show unread messages',
        handler: this.handleUnread.bind(this),
      },
      {
        command: 'search',
        description: 'Search messages',
        handler: this.handleSearch.bind(this),
      },
      {
        command: 'notify',
        description: 'Manage notifications',
        handler: this.handleNotify.bind(this),
      },
      {
        command: 'connect',
        description: 'Connect Stogram account',
        handler: this.handleConnect.bind(this),
      },
      {
        command: 'disconnect',
        description: 'Disconnect account',
        handler: this.handleDisconnect.bind(this),
      },
    ];
  }

  private setupHandlers() {
    if (!this.bot) return;

    // Register command handlers
    for (const cmd of this.commands) {
      this.bot.onText(new RegExp(`/${cmd.command}(?: (.+))?`), cmd.handler);
    }

    // Handle inline queries
    this.bot.on('inline_query', this.handleInlineQuery.bind(this));

    // Handle callback queries
    this.bot.on('callback_query', this.handleCallbackQuery.bind(this));

    // Handle regular messages
    this.bot.on('message', this.handleMessage.bind(this));
  }

  // Command handlers
  private async handleStart(msg: TelegramBot.Message, match?: RegExpMatchArray) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();
    const firstName = msg.from?.first_name;

    if (!telegramUserId) return;

    // Check if user is already authorized
    const botUser = await prisma.telegramBotUser.findUnique({
      where: { telegramId: telegramUserId },
    });

    if (botUser?.isAuthorized) {
      await this.bot?.sendMessage(
        chatId,
        `👋 Welcome back, ${firstName}! \n\n` +
        `Your Stogram account is connected.\n\n` +
        `Use /help to see all available commands.`
      );
    } else {
      await this.bot?.sendMessage(
        chatId,
        `👋 Welcome to Stogram Bot, ${firstName}! \n\n` +
        `To connect your Stogram account, use /connect command.\n\n` +
        `Or visit the Stogram web app to link your account.`
      );
    }
  }

  private async handleHelp(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    const helpText = `📚 *Stogram Bot Commands*\n\n` +
      `*Basic Commands:*\n` +
      `/start - Start the bot\n` +
      `/help - Show this help message\n` +
      `/status - Check your account status\n\n` +
      `*Chat Management:*\n` +
      `/chats - List your chats\n` +
      `/unread - Show unread messages\n` +
      `/search [query] - Search messages\n\n` +
      `*Notifications:*\n` +
      `/notify on - Enable notifications\n` +
      `/notify off - Disable notifications\n\n` +
      `*Account:*\n` +
      `/connect - Connect your Stogram account\n` +
      `/disconnect - Disconnect your account\n\n` +
      `*Inline Mode:*\n` +
      `You can also search your chats inline by typing @${this.config?.botUsername || 'stogrambot'} in any chat`;

    await this.bot?.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }

  private async handleStatus(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();

    if (!telegramUserId) return;

    const botUser = await prisma.telegramBotUser.findUnique({
      where: { telegramId: telegramUserId },
      include: { stogramUser: true },
    });

    if (!botUser?.isAuthorized || !botUser?.stogramUser) {
      await this.bot?.sendMessage(
        chatId,
        `❌ Your account is not connected.\n\n` +
        `Use /connect to link your Stogram account.`
      );
      return;
    }

    const user = botUser.stogramUser;
    
    // Get unread count
    const unreadChats = await prisma.chatSettings.findMany({
      where: {
        userId: user.id,
        unreadCount: { gt: 0 },
      },
    });

    const totalUnread = unreadChats.reduce((sum, c) => sum + c.unreadCount, 0);

    await this.bot?.sendMessage(
      chatId,
      `📊 *Account Status*\n\n` +
      `👤 *User:* ${user.displayName || user.username}\n` +
      `📧 *Email:* ${user.email}\n` +
      `💬 *Chats:* ${unreadChats.length}\n` +
      `📬 *Unread Messages:* ${totalUnread}\n` +
      `🔔 *Notifications:* ${this.config?.notifications ? '✅ Enabled' : '❌ Disabled'}\n` +
      `🟢 *Status:* ${user.status}`,
      { parse_mode: 'Markdown' }
    );
  }

  private async handleChats(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();

    if (!telegramUserId) return;

    const botUser = await prisma.telegramBotUser.findUnique({
      where: { telegramId: telegramUserId },
    });

    if (!botUser?.isAuthorized || !botUser?.stogramUserId) {
      await this.bot?.sendMessage(chatId, '❌ Please connect your account first using /connect');
      return;
    }

    const chatMembers = await prisma.chatMember.findMany({
      where: { userId: botUser.stogramUserId },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, username: true, displayName: true, avatar: true },
                },
              },
            },
          },
        },
        chatSettings: true,
      },
      orderBy: { joinedAt: 'desc' },
      take: 10,
    });

    if (chatMembers.length === 0) {
      await this.bot?.sendMessage(chatId, '📭 You have no chats yet');
      return;
    }

    let response = '💬 *Your Chats:*\n\n';
    
    for (const cm of chatMembers) {
      const chat = cm.chat;
      const memberCount = chat.members.length;
      const chatName = chat.type === 'PRIVATE' 
        ? chat.members.find(m => m.user.id !== botUser.stogramUserId)?.user.displayName || 'Unknown'
        : chat.name || 'Unnamed Group';
      
      response += `• *${chatName}* (${memberCount} members)`;
      if (cm.chatSettings?.unreadCount) {
        response += ` - ${cm.chatSettings.unreadCount} unread`;
      }
      response += '\n';
    }

    await this.bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  }

  private async handleUnread(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();

    if (!telegramUserId) return;

    const botUser = await prisma.telegramBotUser.findUnique({
      where: { telegramId: telegramUserId },
    });

    if (!botUser?.isAuthorized || !botUser?.stogramUserId) {
      await this.bot?.sendMessage(chatId, '❌ Please connect your account first using /connect');
      return;
    }

    const unreadChats = await prisma.chatSettings.findMany({
      where: {
        userId: botUser.stogramUserId,
        unreadCount: { gt: 0 },
      },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, username: true, displayName: true },
                },
              },
            },
          },
        },
      },
      orderBy: { unreadCount: 'desc' },
      take: 10,
    });

    if (unreadChats.length === 0) {
      await this.bot?.sendMessage(chatId, '✅ You have no unread messages!');
      return;
    }

    let response = '📬 *Unread Messages:*\n\n';
    
    for (const chat of unreadChats) {
      const chatName = chat.chat.type === 'PRIVATE'
        ? chat.chat.members.find(m => m.user.id !== botUser.stogramUserId)?.user.displayName || 'Unknown'
        : chat.chat.name || 'Unnamed';
      
      response += `• *${chatName}*: ${chat.unreadCount} unread\n`;
    }

    await this.bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  }

  private async handleSearch(msg: TelegramBot.Message, match?: RegExpMatchArray) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();
    const query = match?.[1];

    if (!telegramUserId) return;

    if (!query) {
      await this.bot?.sendMessage(chatId, '🔍 Please provide a search query.\nUsage: /search [query]');
      return;
    }

    const botUser = await prisma.telegramBotUser.findUnique({
      where: { telegramId: telegramUserId },
    });

    if (!botUser?.isAuthorized || !botUser?.stogramUserId) {
      await this.bot?.sendMessage(chatId, '❌ Please connect your account first using /connect');
      return;
    }

    // Search messages
    const messages = await prisma.message.findMany({
      where: {
        chat: {
          members: {
            some: { userId: botUser.stogramUserId },
          },
        },
        content: { contains: query, mode: 'insensitive' },
        isDeleted: false,
      },
      include: {
        sender: {
          select: { username: true, displayName: true },
        },
        chat: {
          select: { name: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (messages.length === 0) {
      await this.bot?.sendMessage(chatId, `🔍 No messages found for "${query}"`);
      return;
    }

    let response = `🔍 *Search results for "${query}":*\n\n`;
    
    for (const msg of messages) {
      const senderName = msg.sender.displayName || msg.sender.username || 'Unknown';
      const chatName = msg.chat.type === 'PRIVATE' ? 'Private Chat' : msg.chat.name || 'Group';
      const content = msg.content?.substring(0, 100) || '(no text)';
      
      response += `• *${chatName}* from ${senderName}:\n"${content}"\n\n`;
    }

    await this.bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  }

  private async handleNotify(msg: TelegramBot.Message, match?: RegExpMatchArray) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();
    const action = match?.[1];

    if (!telegramUserId) return;

    const botUser = await prisma.telegramBotUser.findUnique({
      where: { telegramId: telegramUserId },
    });

    if (!botUser?.isAuthorized || !botUser?.stogramUserId) {
      await this.bot?.sendMessage(chatId, '❌ Please connect your account first using /connect');
      return;
    }

    if (!action || !['on', 'off'].includes(action)) {
      await this.bot?.sendMessage(
        chatId,
        '🔔 *Notification Settings*\n\n' +
        'Usage: /notify [on|off]\n\n' +
        'Example: /notify on',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const enabled = action === 'on';
    
    // Update bot config
    if (this.config) {
      await prisma.telegramBotConfig.update({
        where: { id: this.config.id },
        data: { notifications: enabled },
      });
      this.config.notifications = enabled;
    }

    await this.bot?.sendMessage(
      chatId,
      `🔔 Notifications ${enabled ? '✅ enabled' : '❌ disabled'}`
    );
  }

  private async handleConnect(msg: TelegramBot.Message, match?: RegExpMatchArray) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();
    const authCode = match?.[1];

    if (!telegramUserId) return;

    // Check if user already connected
    const existingUser = await prisma.telegramBotUser.findUnique({
      where: { telegramId: telegramUserId },
    });

    if (existingUser?.isAuthorized) {
      await this.bot?.sendMessage(
        chatId,
        'ℹ️ Your account is already connected!\n\n' +
        'Use /disconnect to disconnect your account.'
      );
      return;
    }

    if (authCode) {
      // Verify auth code and link account
      // For simplicity, we'll look up by username or email
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: authCode },
            { email: authCode },
          ],
        },
      });

      if (user) {
        await prisma.telegramBotUser.upsert({
          where: { telegramId: telegramUserId },
          create: {
            telegramId: telegramUserId,
            stogramUserId: user.id,
            username: msg.from?.username,
            firstName: msg.from?.first_name,
            lastName: msg.from?.last_name,
            isAuthorized: true,
          },
          update: {
            stogramUserId: user.id,
            username: msg.from?.username,
            firstName: msg.from?.first_name,
            lastName: msg.from?.last_name,
            isAuthorized: true,
          },
        });

        await this.bot?.sendMessage(
          chatId,
          `✅ Successfully connected to Stogram!\n\n` +
          `Connected as: ${user.displayName || user.username}`
        );
      } else {
        await this.bot?.sendMessage(
          chatId,
          '❌ Invalid username or email.\n\n' +
          'Please check and try again.'
        );
      }
    } else {
      await this.bot?.sendMessage(
        chatId,
        '🔗 *Connect Your Account*\n\n' +
        'To connect your Stogram account, please provide your username or email:\n\n' +
        'Usage: /connect [username|email]\n\n' +
        'Example: /connect john or /connect john@example.com'
      );
    }
  }

  private async handleDisconnect(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();

    if (!telegramUserId) return;

    const botUser = await prisma.telegramBotUser.findUnique({
      where: { telegramId: telegramUserId },
    });

    if (!botUser?.isAuthorized) {
      await this.bot?.sendMessage(chatId, 'ℹ️ Your account is not connected.');
      return;
    }

    await prisma.telegramBotUser.update({
      where: { telegramId: telegramUserId },
      data: { isAuthorized: false, stogramUserId: null },
    });

    await this.bot?.sendMessage(
      chatId,
      '✅ Your account has been disconnected.'
    );
  }

  // Inline query handler
  private async handleInlineQuery(msg: TelegramBot.CallbackQuery) {
    const query = msg.query;
    const telegramUserId = msg.from?.id.toString();

    if (!telegramUserId || !query) return;

    const botUser = await prisma.telegramBotUser.findUnique({
      where: { telegramId: telegramUserId },
    });

    if (!botUser?.isAuthorized || !botUser?.stogramUserId) return;

    // Search chats
    const chatMembers = await prisma.chatMember.findMany({
      where: {
        userId: botUser.stogramUserId,
        chat: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
      },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, username: true, displayName: true },
                },
              },
            },
          },
        },
      },
      take: 10,
    });

    const results = chatMembers.map(cm => ({
      type: 'article' as const,
      id: cm.chat.id,
      title: cm.chat.name || 'Chat',
      description: cm.chat.type === 'PRIVATE'
        ? cm.chat.members.find(m => m.user.id !== botUser.stogramUserId)?.user.displayName || 'Private'
        : `${cm.chat.members.length} members`,
      input_message_content: {
        message_text: `Chat: ${cm.chat.name || 'Private'}`,
      },
    }));

    await this.bot?.answerInlineQuery(msg.id, results, { cache_time: 0 });
  }

  // Callback query handler
  private async handleCallbackQuery(msg: TelegramBot.CallbackQuery) {
    const data = msg.data;
    const chatId = msg.message?.chat.id;

    if (!data || !chatId) return;

    // Handle callback data
    if (data === 'notify_on') {
      if (this.config) {
        await prisma.telegramBotConfig.update({
          where: { id: this.config.id },
          data: { notifications: true },
        });
        this.config.notifications = true;
      }
      await this.bot?.answerCallbackQuery(msg.id, { text: 'Notifications enabled!' });
    } else if (data === 'notify_off') {
      if (this.config) {
        await prisma.telegramBotConfig.update({
          where: { id: this.config.id },
          data: { notifications: false },
        });
        this.config.notifications = false;
      }
      await this.bot?.answerCallbackQuery(msg.id, { text: 'Notifications disabled!' });
    }
  }

  // Regular message handler
  private async handleMessage(msg: TelegramBot.Message) {
    if (msg.text?.startsWith('/')) return; // Skip commands
    if (!msg.from) return;

    const telegramUserId = msg.from.id.toString();

    // Check for authorized user and send to connected chat
    const botUser = await prisma.telegramBotUser.findUnique({
      where: { telegramId: telegramUserId },
    });

    if (!botUser?.isAuthorized || !botUser?.stogramUserId) return;

    // Log the message
    await prisma.telegramBotMessage.create({
      data: {
        telegramBotId: this.config?.id || 'default',
        telegramChatId: msg.chat.id.toString(),
        telegramUserId,
        messageId: msg.message_id,
        direction: 'incoming',
        content: msg.text,
      },
    });

    // TODO: Forward to Stogram if needed
  }

  // Public methods
  async getConfig() {
    return await prisma.telegramBotConfig.findFirst();
  }

  async saveConfig(data: {
    botToken?: string;
    botUsername?: string;
    webhookUrl?: string;
    commands?: string[];
    notifications?: boolean;
    enabled?: boolean;
  }) {
    const existing = await prisma.telegramBotConfig.findFirst();

    if (existing) {
      const updated = await prisma.telegramBotConfig.update({
        where: { id: existing.id },
        data: {
          botToken: data.botToken ?? existing.botToken,
          botUsername: data.botUsername ?? existing.botUsername,
          webhookUrl: data.webhookUrl ?? existing.webhookUrl,
          commands: data.commands ? JSON.stringify(data.commands) : existing.commands,
          notifications: data.notifications ?? existing.notifications,
          enabled: data.enabled ?? existing.enabled,
        },
      });
      
      // Reinitialize bot if needed
      await this.loadConfig();
      if (this.config?.enabled && this.config?.botToken) {
        this.initializeBot();
      }
      
      return updated;
    } else {
      const created = await prisma.telegramBotConfig.create({
        data: {
          botToken: data.botToken || '',
          botUsername: data.botUsername,
          webhookUrl: data.webhookUrl,
          commands: data.commands ? JSON.stringify(data.commands) : '[]',
          notifications: data.notifications ?? true,
          enabled: data.enabled ?? false,
        },
      });

      await this.loadConfig();
      if (this.config?.enabled && this.config?.botToken) {
        this.initializeBot();
      }

      return created;
    }
  }

  async getStats() {
    const botUserCount = await prisma.telegramBotUser.count({
      where: { isAuthorized: true },
    });

    const messageCount = await prisma.telegramBotMessage.count();

    return {
      authorizedUsers: botUserCount,
      totalMessages: messageCount,
      enabled: this.config?.enabled || false,
      botUsername: this.config?.botUsername,
    };
  }

  async getUsers() {
    return await prisma.telegramBotUser.findMany({
      where: { isAuthorized: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async authorizeUser(telegramId: string, stogramUserId: string) {
    return await prisma.telegramBotUser.update({
      where: { telegramId },
      data: { isAuthorized: true, stogramUserId },
    });
  }

  async sendMessage(telegramUserId: string, content: string, options?: TelegramBot.SendMessageOptions): Promise<boolean> {
    if (!this.bot) return false;

    try {
      await this.bot.sendMessage(telegramUserId, content, {
        parse_mode: 'Markdown',
        ...options,
      });
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  async sendNotificationToUser(stogramUserId: string, message: string): Promise<boolean> {
    if (!this.config?.notifications) return false;

    const botUser = await prisma.telegramBotUser.findFirst({
      where: { stogramUserId, isAuthorized: true },
    });

    if (!botUser) return false;

    return await this.sendMessage(botUser.telegramId, message);
  }

  async broadcastNotification(message: string): Promise<number> {
    if (!this.config?.notifications) return 0;

    const users = await prisma.telegramBotUser.findMany({
      where: { isAuthorized: true },
    });

    let sentCount = 0;
    for (const user of users) {
      const success = await this.sendMessage(user.telegramId, message);
      if (success) sentCount++;
    }

    return sentCount;
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    if (!this.config?.botToken) return false;

    const secret = crypto
      .createHash('sha256')
      .update(this.config.botToken)
      .digest();

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  processWebhookUpdate(update: TelegramBot.Update) {
    if (!this.bot) return;
    this.bot.processUpdate(update);
  }
}

export default new TelegramBotService();
