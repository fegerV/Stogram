import axios from 'axios';
import prisma from '../utils/prisma';
import botApiCompatibilityService from './botApiCompatibilityService';
import { sendBotMessage as sendBotMessageService } from './botService';
import { io } from '../index';
import { deliverToBotWebhooks } from './webhookService';

type JsonRecord = Record<string, unknown>;

const BOT_DEFAULT_COMMANDS = new Set(['/start', '/help']);

class InternalBotRuntimeService {
  private async deliverToDirectWebhook(
    bot: {
      id: string;
      webhookUrl: string | null;
    },
    event: string,
    payload: JsonRecord
  ) {
    if (!bot.webhookUrl) {
      return;
    }

    await axios.post(bot.webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Bot-Event': event,
        'X-Bot-Id': bot.id,
      },
      timeout: 10000,
    });
  }

  private async sendDefaultCommandReply(
    bot: {
      id: string;
      ownerId: string;
      isActive: boolean;
      username: string;
      displayName: string;
      commands: Array<{ command: string; description: string }>;
    },
    message: {
      chatId: string;
    }
  ) {
    const commandList = bot.commands.length > 0
      ? bot.commands.map((command) => `${command.command} - ${command.description}`).join('\n')
      : 'Команды пока не настроены.';

    const helpText = [
      `Привет, я ${bot.displayName}.`,
      '',
      'Я работаю как локальный бот Stogram.',
      '',
      'Доступные команды:',
      commandList,
    ].join('\n');

    const reply = await sendBotMessageService(bot, {
      chatId: message.chatId,
      content: helpText,
      type: 'TEXT',
    });

    io.to(`chat:${message.chatId}`).emit('message:new', reply);
  }

  private async sendUnavailableCommandReply(
    bot: {
      id: string;
      ownerId: string;
      isActive: boolean;
      displayName: string;
    },
    message: {
      chatId: string;
    },
    command: string
  ) {
    const reply = await sendBotMessageService(bot, {
      chatId: message.chatId,
      content: `Команда ${command} зарегистрирована, но для бота ${bot.displayName} ещё не настроен webhook-обработчик.`,
      type: 'TEXT',
    });

    io.to(`chat:${message.chatId}`).emit('message:new', reply);
  }

  private async hasExternalRuntime(botId: string) {
    const [webhookCount, bot] = await Promise.all([
      prisma.webhook.count({
        where: {
          botId,
          isActive: true,
        },
      }),
      prisma.bot.findUnique({
        where: { id: botId },
        select: {
          webhookUrl: true,
        },
      }),
    ]);

    return webhookCount > 0 || Boolean(bot?.webhookUrl);
  }

  async dispatchToBot(botId: string, event: string, data: JsonRecord) {
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: {
        id: true,
        username: true,
        displayName: true,
        token: true,
        webhookUrl: true,
        ownerId: true,
        isInline: true,
      },
    });

    if (!bot) {
      return;
    }

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      bot: {
        id: bot.id,
        username: bot.username,
        displayName: bot.displayName,
        ownerId: bot.ownerId,
        isInline: bot.isInline,
      },
      data,
    } satisfies JsonRecord;

    await Promise.allSettled([
      deliverToBotWebhooks(botId, event, payload),
      this.deliverToDirectWebhook(bot, event, payload),
    ]);
  }

  async dispatchChatMessageEvent(messageId: string, event: 'message.created' | 'message.updated' | 'message.deleted') {
    const message = await prisma.message.findUnique({
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
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!message) {
      return;
    }

    const installations = await prisma.botChatInstallation.findMany({
      where: {
        chatId: message.chat.id,
        isActive: true,
        bot: {
          isActive: true,
        },
      },
      include: {
        bot: {
          include: {
            commands: true,
          },
        },
      },
    });

    const bots = installations
      .map((installation) => installation.bot)
      .filter((bot, index, collection) => collection.findIndex((item) => item.id === bot.id) === index);

    if (bots.length === 0) {
      return;
    }

    const baseData = {
      message: {
        id: message.id,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        senderId: message.senderId,
        botId: message.botId,
        linkPreview: message.linkPreview,
      },
      chat: {
        id: message.chat.id,
        type: message.chat.type,
        name: message.chat.name,
        description: message.chat.description,
        members: message.chat.members.map((member) => ({
          id: member.user.id,
          username: member.user.username,
          displayName: member.user.displayName,
          role: member.role,
        })),
      },
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        displayName: message.sender.displayName,
        avatar: message.sender.avatar,
      },
      ...(message.bot ? {
        bot: {
          id: message.bot.id,
          username: message.bot.username,
          displayName: message.bot.displayName,
        },
      } : {}),
    } satisfies JsonRecord;

    await Promise.allSettled(
      bots.map(async (bot) => {
        if (message.botId === bot.id) {
          return;
        }

        await this.dispatchToBot(bot.id, event, baseData);
        if (event === 'message.created') {
          await botApiCompatibilityService.publishMessageUpdate(bot.id, message.id, 'message');
        } else if (event === 'message.updated') {
          await botApiCompatibilityService.publishMessageUpdate(bot.id, message.id, 'edited_message');
        }

        if (event !== 'message.created' || !message.content?.startsWith('/')) {
          return;
        }

        const [commandName, ...argParts] = message.content.trim().split(/\s+/);
        const rawMention = commandName.includes('@')
          ? commandName.slice(commandName.indexOf('@') + 1).toLowerCase()
          : null;
        const normalizedCommand = commandName.includes('@')
          ? commandName.slice(0, commandName.indexOf('@'))
          : commandName;

        if (rawMention && rawMention !== bot.username.toLowerCase()) {
          return;
        }

        const matchedCommand = bot.commands.find((command) => command.command === normalizedCommand);
        if (!matchedCommand && !BOT_DEFAULT_COMMANDS.has(normalizedCommand)) {
          return;
        }

        const hasExternalRuntime = await this.hasExternalRuntime(bot.id);
        await this.dispatchToBot(bot.id, 'command.received', {
          ...baseData,
          command: {
            id: matchedCommand?.id || null,
            command: matchedCommand?.command || normalizedCommand,
            description: matchedCommand?.description || null,
            raw: message.content,
            args: argParts,
            text: argParts.join(' '),
          },
        });

        if (!hasExternalRuntime) {
          if (BOT_DEFAULT_COMMANDS.has(normalizedCommand)) {
            await this.sendDefaultCommandReply(bot, {
              chatId: message.chat.id,
            });
          } else if (matchedCommand) {
            await this.sendUnavailableCommandReply(bot, {
              chatId: message.chat.id,
            }, normalizedCommand);
          }
        }
      })
    );
  }
}

export default new InternalBotRuntimeService();
