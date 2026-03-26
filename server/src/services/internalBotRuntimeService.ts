import axios from 'axios';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import botApiCompatibilityService from './botApiCompatibilityService';

type JsonRecord = Record<string, unknown>;

interface DeliverOptions {
  botId: string;
  event: string;
  payload: JsonRecord;
}

const BOT_EVENT_WILDCARD = '*';

const parseSubscribedEvents = (rawEvents?: string | null): string[] => {
  if (!rawEvents) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawEvents);
    return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
  } catch {
    return [];
  }
};

const signPayload = (secret: string, payload: string) =>
  crypto.createHmac('sha256', secret).update(payload).digest('hex');

class InternalBotRuntimeService {
  private async deliverToRegisteredWebhooks({
    botId,
    event,
    payload,
  }: DeliverOptions) {
    const webhooks = await prisma.webhook.findMany({
      where: {
        botId,
        isActive: true,
      },
    });

    const rawPayload = JSON.stringify(payload);

    for (const webhook of webhooks) {
      const subscribedEvents = parseSubscribedEvents(webhook.events);
      if (
        subscribedEvents.length > 0
        && !subscribedEvents.includes(BOT_EVENT_WILDCARD)
        && !subscribedEvents.includes(event)
      ) {
        continue;
      }

      try {
        const signature = webhook.secret
          ? signPayload(webhook.secret, rawPayload)
          : undefined;

        const response = await axios.post(webhook.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Bot-Event': event,
            'X-Bot-Signature': signature,
            'X-Bot-Id': botId,
          },
          timeout: 10000,
        });

        await prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event,
            payload: rawPayload,
            status: response.status,
            response: JSON.stringify(response.data),
            attempts: 1,
          },
        });
      } catch (error: any) {
        await prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event,
            payload: rawPayload,
            status: error.response?.status || 0,
            response: error.message || 'Webhook delivery failed',
            attempts: 1,
          },
        });
      }
    }
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
      this.deliverToRegisteredWebhooks({ botId, event, payload }),
    ]);
  }

  async dispatchChatMessageEvent(messageId: string, event: 'message.created' | 'message.updated' | 'message.deleted') {
    const message = await prisma.message.findUnique({
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

    const ownerIds = message.chat.members.map((member) => member.userId);
    const bots = await prisma.bot.findMany({
      where: {
        ownerId: { in: ownerIds },
        isActive: true,
      },
      include: {
        commands: true,
      },
    });

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
    } satisfies JsonRecord;

    await Promise.allSettled(
      bots.map(async (bot) => {
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
        const normalizedCommand = commandName.includes('@')
          ? commandName.slice(0, commandName.indexOf('@'))
          : commandName;

        const matchedCommand = bot.commands.find((command) => command.command === normalizedCommand);
        if (!matchedCommand) {
          return;
        }

        await this.dispatchToBot(bot.id, 'command.received', {
          ...baseData,
          command: {
            id: matchedCommand.id,
            command: matchedCommand.command,
            description: matchedCommand.description,
            raw: message.content,
            args: argParts,
            text: argParts.join(' '),
          },
        });
      })
    );
  }
}

export default new InternalBotRuntimeService();
