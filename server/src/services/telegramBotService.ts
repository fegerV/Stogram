import crypto from 'crypto';
import TelegramBot from 'node-telegram-bot-api';
import prisma from '../utils/prisma';

interface BotCommandConfig {
  command: string;
  description: string;
}

interface BotCommand {
  command: string;
  description: string;
  handler: (msg: TelegramBot.Message, match?: RegExpExecArray | null) => Promise<void>;
}

const resolveSecretValue = (incomingValue: string | undefined, existingValue?: string | null) => {
  if (typeof incomingValue !== 'string') {
    return existingValue ?? undefined;
  }

  const trimmedValue = incomingValue.trim();
  if (!trimmedValue) {
    return existingValue ?? undefined;
  }

  if (existingValue && trimmedValue === `***${existingValue.slice(-4)}`) {
    return existingValue;
  }

  return trimmedValue;
};

class TelegramBotService {
  private bot: TelegramBot | null = null;
  private config: Awaited<ReturnType<typeof prisma.telegramBotConfig.findFirst>> | null = null;
  private commands: BotCommand[] = [];

  async initialize() {
    await this.loadConfig();
    if (this.config?.enabled && this.config.botToken) {
      this.initializeBot();
    }
  }

  private async loadConfig() {
    this.config = await prisma.telegramBotConfig.findFirst();
  }

  private getCommandConfigs(): BotCommandConfig[] {
    if (!this.config?.commands) {
      return this.getDefaultCommands();
    }

    try {
      return JSON.parse(this.config.commands) as BotCommandConfig[];
    } catch {
      return this.getDefaultCommands();
    }
  }

  private getDefaultCommands(): BotCommandConfig[] {
    return [
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
  }

  private getWebhookSecretToken(): string {
    return crypto
      .createHash('sha256')
      .update(this.config?.botToken || '')
      .digest('hex')
      .slice(0, 32);
  }

  private initializeBot() {
    if (!this.config?.botToken) return;

    if (this.bot) {
      this.bot.removeAllListeners();
      void this.bot.stopPolling().catch(() => undefined);
    }

    const useWebhook = Boolean(this.config.webhookUrl);

    if (useWebhook) {
      this.bot = new TelegramBot(this.config.botToken, { webHook: true });
      if (this.config.webhookUrl) {
        this.bot.setWebHook(this.config.webhookUrl, {
          secret_token: this.getWebhookSecretToken(),
        } as never);
      }
    } else {
      this.bot = new TelegramBot(this.config.botToken, { polling: true });
    }

    this.setupCommands();
    this.setupHandlers();
  }

  private setupCommands() {
    const commandsConfig = this.getCommandConfigs();

    if (this.bot) {
      void this.bot.setMyCommands(commandsConfig);
    }

    this.commands = [
      { command: 'start', description: 'Start the bot', handler: this.handleStart.bind(this) },
      { command: 'help', description: 'Show help information', handler: this.handleHelp.bind(this) },
      { command: 'status', description: 'Check account status', handler: this.handleStatus.bind(this) },
      { command: 'chats', description: 'List your chats', handler: this.handleChats.bind(this) },
      { command: 'unread', description: 'Show unread messages', handler: this.handleUnread.bind(this) },
      { command: 'search', description: 'Search messages', handler: this.handleSearch.bind(this) },
      { command: 'notify', description: 'Manage notifications', handler: this.handleNotify.bind(this) },
      { command: 'connect', description: 'Connect Stogram account', handler: this.handleConnect.bind(this) },
      { command: 'disconnect', description: 'Disconnect account', handler: this.handleDisconnect.bind(this) },
    ];
  }

  private setupHandlers() {
    if (!this.bot) return;

    for (const cmd of this.commands) {
      this.bot.onText(new RegExp(`/${cmd.command}(?: (.+))?`), (msg, match) => {
        void cmd.handler(msg, match);
      });
    }

    this.bot.on('inline_query', (query) => {
      void this.handleInlineQuery(query);
    });
    this.bot.on('callback_query', (query) => {
      void this.handleCallbackQuery(query);
    });
    this.bot.on('message', (message) => {
      void this.handleMessage(message);
    });
  }

  private async getAuthorizedBotUser(telegramId?: string) {
    if (!telegramId) return null;
    return prisma.telegramBotUser.findUnique({
      where: { telegramId },
    });
  }

  private async handleStart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();
    const firstName = msg.from?.first_name;

    if (!telegramUserId) return;

    const botUser = await this.getAuthorizedBotUser(telegramUserId);

    if (botUser?.isAuthorized) {
      await this.bot?.sendMessage(
        chatId,
        `Welcome back, ${firstName}!\n\nYour Stogram account is connected.\n\nUse /help to see all available commands.`
      );
      return;
    }

    await this.bot?.sendMessage(
      chatId,
      `Welcome to Stogram Bot, ${firstName}!\n\nTo connect your Stogram account, use /connect.\n\nOr visit the Stogram web app to link your account.`
    );
  }

  private async handleHelp(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const helpText = `*Stogram Bot Commands*\n\n`
      + `*Basic Commands:*\n`
      + `/start - Start the bot\n`
      + `/help - Show this help message\n`
      + `/status - Check your account status\n\n`
      + `*Chat Management:*\n`
      + `/chats - List your chats\n`
      + `/unread - Show unread messages\n`
      + `/search [query] - Search messages\n\n`
      + `*Notifications:*\n`
      + `/notify on - Enable notifications\n`
      + `/notify off - Disable notifications\n\n`
      + `*Account:*\n`
      + `/connect - Connect your Stogram account\n`
      + `/disconnect - Disconnect your account\n\n`
      + `*Inline Mode:*\n`
      + `Type @${this.config?.botUsername || 'stogrambot'} in any chat to search your chats inline.`;

    await this.bot?.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }

  private async handleStatus(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();

    if (!telegramUserId) return;

    const botUser = await this.getAuthorizedBotUser(telegramUserId);
    if (!botUser?.isAuthorized || !botUser.stogramUserId) {
      await this.bot?.sendMessage(chatId, 'Your account is not connected.\n\nUse /connect to link your Stogram account.');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: botUser.stogramUserId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        status: true,
      },
    });

    if (!user) {
      await this.bot?.sendMessage(chatId, 'Linked Stogram account not found. Use /connect to reconnect.');
      return;
    }

    const unreadChats = await prisma.chatSettings.findMany({
      where: {
        userId: user.id,
        unreadCount: { gt: 0 },
      },
    });

    const totalUnread = unreadChats.reduce((sum, chat) => sum + chat.unreadCount, 0);

    await this.bot?.sendMessage(
      chatId,
      `*Account Status*\n\n`
        + `*User:* ${user.displayName || user.username}\n`
        + `*Email:* ${user.email}\n`
        + `*Chats with unread:* ${unreadChats.length}\n`
        + `*Unread messages:* ${totalUnread}\n`
        + `*Notifications:* ${this.config?.notifications ? 'Enabled' : 'Disabled'}\n`
        + `*Status:* ${user.status}`,
      { parse_mode: 'Markdown' }
    );
  }

  private async handleChats(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();

    if (!telegramUserId) return;

    const botUser = await this.getAuthorizedBotUser(telegramUserId);
    if (!botUser?.isAuthorized || !botUser.stogramUserId) {
      await this.bot?.sendMessage(chatId, 'Please connect your account first using /connect');
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
      },
      orderBy: { joinedAt: 'desc' },
      take: 10,
    });

    if (chatMembers.length === 0) {
      await this.bot?.sendMessage(chatId, 'You have no chats yet');
      return;
    }

    const unreadSettings = await prisma.chatSettings.findMany({
      where: {
        userId: botUser.stogramUserId,
        chatId: { in: chatMembers.map((member) => member.chatId) },
      },
      select: {
        chatId: true,
        unreadCount: true,
      },
    });
    const unreadMap = new Map(unreadSettings.map((settings) => [settings.chatId, settings.unreadCount]));

    let response = '*Your Chats:*\n\n';

    for (const membership of chatMembers) {
      const chat = membership.chat;
      const memberCount = chat.members.length;
      const privatePeer = chat.members.find((member) => member.user.id !== botUser.stogramUserId)?.user;
      const chatName = chat.type === 'PRIVATE'
        ? privatePeer?.displayName || privatePeer?.username || 'Private chat'
        : chat.name || 'Unnamed group';

      response += `- *${chatName}* (${memberCount} members)`;
      const unreadCount = unreadMap.get(membership.chatId);
      if (unreadCount) {
        response += ` - ${unreadCount} unread`;
      }
      response += '\n';
    }

    await this.bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  }

  private async handleUnread(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();

    if (!telegramUserId) return;

    const botUser = await this.getAuthorizedBotUser(telegramUserId);
    if (!botUser?.isAuthorized || !botUser.stogramUserId) {
      await this.bot?.sendMessage(chatId, 'Please connect your account first using /connect');
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
      await this.bot?.sendMessage(chatId, 'You have no unread messages.');
      return;
    }

    let response = '*Unread Messages:*\n\n';

    for (const unreadChat of unreadChats) {
      const privatePeer = unreadChat.chat.members.find((member) => member.user.id !== botUser.stogramUserId)?.user;
      const chatName = unreadChat.chat.type === 'PRIVATE'
        ? privatePeer?.displayName || privatePeer?.username || 'Private chat'
        : unreadChat.chat.name || 'Unnamed chat';
      response += `- *${chatName}*: ${unreadChat.unreadCount} unread\n`;
    }

    await this.bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  }

  private async handleSearch(msg: TelegramBot.Message, match?: RegExpExecArray | null) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();
    const query = match?.[1]?.trim();

    if (!telegramUserId) return;
    if (!query) {
      await this.bot?.sendMessage(chatId, 'Please provide a search query.\nUsage: /search [query]');
      return;
    }

    const botUser = await this.getAuthorizedBotUser(telegramUserId);
    if (!botUser?.isAuthorized || !botUser.stogramUserId) {
      await this.bot?.sendMessage(chatId, 'Please connect your account first using /connect');
      return;
    }

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
      await this.bot?.sendMessage(chatId, `No messages found for "${query}"`);
      return;
    }

    let response = `*Search results for "${query}":*\n\n`;
    for (const message of messages) {
      const senderName = message.sender.displayName || message.sender.username || 'Unknown';
      const chatName = message.chat.type === 'PRIVATE' ? 'Private chat' : message.chat.name || 'Group';
      const content = message.content?.slice(0, 100) || '(no text)';
      response += `- *${chatName}* from ${senderName}:\n"${content}"\n\n`;
    }

    await this.bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  }

  private async handleNotify(msg: TelegramBot.Message, match?: RegExpExecArray | null) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();
    const action = match?.[1]?.trim();

    if (!telegramUserId) return;

    const botUser = await this.getAuthorizedBotUser(telegramUserId);
    if (!botUser?.isAuthorized || !botUser.stogramUserId) {
      await this.bot?.sendMessage(chatId, 'Please connect your account first using /connect');
      return;
    }

    if (!action || !['on', 'off'].includes(action)) {
      await this.bot?.sendMessage(
        chatId,
        '*Notification Settings*\n\nUsage: /notify [on|off]\n\nExample: /notify on',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const enabled = action === 'on';
    if (this.config) {
      await prisma.telegramBotConfig.update({
        where: { id: this.config.id },
        data: { notifications: enabled },
      });
      this.config.notifications = enabled;
    }

    await this.bot?.sendMessage(chatId, `Notifications ${enabled ? 'enabled' : 'disabled'}`);
  }

  private async handleConnect(msg: TelegramBot.Message, match?: RegExpExecArray | null) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();
    const authCode = match?.[1]?.trim();

    if (!telegramUserId) return;

    const existingUser = await this.getAuthorizedBotUser(telegramUserId);
    if (existingUser?.isAuthorized) {
      await this.bot?.sendMessage(
        chatId,
        'Your account is already connected.\n\nUse /disconnect to disconnect your account.'
      );
      return;
    }

    if (!authCode) {
      await this.bot?.sendMessage(
        chatId,
        '*Connect Your Account*\n\nTo connect your Stogram account, provide your username or email:\n\nUsage: /connect [username|email]',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: authCode },
          { email: authCode },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
      },
    });

    if (!user) {
      await this.bot?.sendMessage(chatId, 'Invalid username or email. Please check and try again.');
      return;
    }

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

    await this.bot?.sendMessage(chatId, `Successfully connected to Stogram as ${user.displayName || user.username}.`);
  }

  private async handleDisconnect(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id.toString();

    if (!telegramUserId) return;

    const botUser = await this.getAuthorizedBotUser(telegramUserId);
    if (!botUser?.isAuthorized) {
      await this.bot?.sendMessage(chatId, 'Your account is not connected.');
      return;
    }

    await prisma.telegramBotUser.update({
      where: { telegramId: telegramUserId },
      data: { isAuthorized: false, stogramUserId: null },
    });

    await this.bot?.sendMessage(chatId, 'Your account has been disconnected.');
  }

  private async handleInlineQuery(query: TelegramBot.InlineQuery) {
    const searchQuery = query.query.trim();
    const telegramUserId = query.from?.id.toString();

    if (!telegramUserId || !searchQuery) return;

    const botUser = await this.getAuthorizedBotUser(telegramUserId);
    if (!botUser?.isAuthorized || !botUser.stogramUserId) return;

    const chatMembers = await prisma.chatMember.findMany({
      where: {
        userId: botUser.stogramUserId,
        chat: {
          name: { contains: searchQuery },
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

    const results: TelegramBot.InlineQueryResultArticle[] = chatMembers.map((membership) => {
      const privatePeer = membership.chat.members.find((member) => member.user.id !== botUser.stogramUserId)?.user;
      return {
        type: 'article',
        id: membership.chat.id,
        title: membership.chat.name || privatePeer?.displayName || privatePeer?.username || 'Chat',
        description: membership.chat.type === 'PRIVATE'
          ? privatePeer?.displayName || privatePeer?.username || 'Private chat'
          : `${membership.chat.members.length} members`,
        input_message_content: {
          message_text: `Chat: ${membership.chat.name || privatePeer?.displayName || 'Private chat'}`,
        },
      };
    });

    await this.bot?.answerInlineQuery(query.id, results, { cache_time: 0 });
  }

  private async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
    const data = query.data;
    if (!data) return;

    if (data === 'notify_on' || data === 'notify_off') {
      const enabled = data === 'notify_on';
      if (this.config) {
        await prisma.telegramBotConfig.update({
          where: { id: this.config.id },
          data: { notifications: enabled },
        });
        this.config.notifications = enabled;
      }

      await this.bot?.answerCallbackQuery(query.id, {
        text: enabled ? 'Notifications enabled!' : 'Notifications disabled!',
      });
    }
  }

  private async handleMessage(msg: TelegramBot.Message) {
    if (msg.text?.startsWith('/')) return;
    if (!msg.from) return;

    const telegramUserId = msg.from.id.toString();
    const botUser = await this.getAuthorizedBotUser(telegramUserId);
    if (!botUser?.isAuthorized || !botUser.stogramUserId) return;

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
  }

  async getConfig() {
    return prisma.telegramBotConfig.findFirst();
  }

  async saveConfig(data: {
    botToken?: string;
    botUsername?: string;
    webhookUrl?: string;
    commands?: BotCommandConfig[];
    notifications?: boolean;
    enabled?: boolean;
  }) {
    const existing = await prisma.telegramBotConfig.findFirst();
    const resolvedBotToken = resolveSecretValue(data.botToken, existing?.botToken);

    const payload = {
      botToken: resolvedBotToken ?? '',
      botUsername: data.botUsername ?? existing?.botUsername ?? null,
      webhookUrl: data.webhookUrl ?? existing?.webhookUrl ?? null,
      commands: JSON.stringify(data.commands ?? this.getCommandConfigs()),
      notifications: data.notifications ?? existing?.notifications ?? true,
      enabled: data.enabled ?? existing?.enabled ?? false,
    };

    const saved = existing
      ? await prisma.telegramBotConfig.update({
          where: { id: existing.id },
          data: payload,
        })
      : await prisma.telegramBotConfig.create({
          data: payload,
        });

    await this.loadConfig();
    if (this.config?.enabled && this.config.botToken) {
      this.initializeBot();
    }

    return saved;
  }

  async getStats() {
    const [botUserCount, messageCount] = await Promise.all([
      prisma.telegramBotUser.count({
        where: { isAuthorized: true },
      }),
      prisma.telegramBotMessage.count(),
    ]);

    return {
      authorizedUsers: botUserCount,
      totalMessages: messageCount,
      enabled: this.config?.enabled || false,
      botUsername: this.config?.botUsername || '',
    };
  }

  async getUsers() {
    return prisma.telegramBotUser.findMany({
      where: { isAuthorized: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async authorizeUser(telegramId: string, stogramUserId: string) {
    return prisma.telegramBotUser.upsert({
      where: { telegramId },
      create: {
        telegramId,
        stogramUserId,
        isAuthorized: true,
      },
      update: {
        stogramUserId,
        isAuthorized: true,
      },
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
    return this.sendMessage(botUser.telegramId, message);
  }

  async broadcastNotification(message: string): Promise<number> {
    if (!this.config?.notifications) return 0;

    const users = await prisma.telegramBotUser.findMany({
      where: { isAuthorized: true },
      select: { telegramId: true },
    });

    let sentCount = 0;
    for (const user of users) {
      if (await this.sendMessage(user.telegramId, message)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  isWebhookRequestAuthorized(secretTokenHeader: string | string[] | undefined): boolean {
    if (!this.config?.enabled || !this.config?.webhookUrl || !this.config?.botToken) {
      return false;
    }

    const headerValue = Array.isArray(secretTokenHeader) ? secretTokenHeader[0] : secretTokenHeader;
    if (!headerValue) {
      return false;
    }

    return headerValue === this.getWebhookSecretToken();
  }

  processWebhookUpdate(update: TelegramBot.Update) {
    if (!this.bot) return;
    this.bot.processUpdate(update);
  }
}

export default new TelegramBotService();
