jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    bot: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    botApiUpdate: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    message: {
      findUnique: jest.fn(),
    },
    botCallbackQuery: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    botInlineQuery: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import axios from 'axios';
import prisma from '../utils/prisma';
import botApiCompatibilityService from '../services/botApiCompatibilityService';

describe('botApiCompatibilityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks earlier updates as consumed when getUpdates is called with offset', async () => {
    (prisma.bot.findUnique as jest.Mock).mockResolvedValue({
      id: 'bot-1',
      token: 'bot-token',
      webhookUrl: null,
      commands: [],
    });
    (prisma.botApiUpdate.findMany as jest.Mock).mockResolvedValue([
      { payload: { update_id: 10, message: { text: 'hello' } } },
      { payload: { update_id: 11, message: { text: 'world' } } },
    ]);

    const result = await botApiCompatibilityService.getUpdates('bot-token', {
      offset: 10,
      limit: 2,
    });

    expect(prisma.botApiUpdate.updateMany).toHaveBeenCalledWith({
      where: {
        botId: 'bot-1',
        consumedAt: null,
        updateId: { lt: 10 },
      },
      data: {
        consumedAt: expect.any(Date),
      },
    });
    expect(prisma.botApiUpdate.findMany).toHaveBeenCalledWith({
      where: {
        botId: 'bot-1',
        consumedAt: null,
        updateId: { gte: 10 },
      },
      orderBy: { updateId: 'asc' },
      take: 2,
    });
    expect(result).toEqual({
      ok: true,
      result: [
        { update_id: 10, message: { text: 'hello' } },
        { update_id: 11, message: { text: 'world' } },
      ],
    });
  });

  it('drops pending updates when deleteWebhook is called with dropPendingUpdates', async () => {
    (prisma.bot.findUnique as jest.Mock).mockResolvedValue({
      id: 'bot-1',
      token: 'bot-token',
      webhookUrl: 'https://example.com/hook',
      commands: [],
    });

    const result = await botApiCompatibilityService.deleteWebhook('bot-token', true);

    expect(prisma.bot.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'bot-1' },
        data: expect.objectContaining({
          webhookUrl: null,
          apiWebhookSecret: null,
        }),
      }),
    );
    expect(prisma.botApiUpdate.updateMany).toHaveBeenCalledWith({
      where: {
        botId: 'bot-1',
        consumedAt: null,
      },
      data: {
        consumedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({ ok: true, result: true });
  });

  it('marks webhook-delivered message updates as consumed', async () => {
    (prisma.bot.findUnique as jest.Mock).mockResolvedValue({
      webhookUrl: 'https://example.com/hook',
      apiWebhookSecret: 'secret',
      apiAllowedUpdates: ['message'],
    });
    (prisma.message.findUnique as jest.Mock).mockResolvedValue({
      id: 'message-1',
      content: 'hello',
      createdAt: new Date('2026-03-28T10:00:00Z'),
      type: 'TEXT',
      sender: {
        id: 'user-1',
        username: 'user',
        displayName: 'User',
      },
      bot: null,
      chat: {
        id: 'chat-1',
        type: 'PRIVATE',
        name: null,
      },
      linkPreview: null,
    });
    (prisma.bot.update as jest.Mock).mockResolvedValue({
      lastUpdateId: 41,
    });

    await botApiCompatibilityService.publishMessageUpdate('bot-1', 'message-1', 'message');

    expect(prisma.botApiUpdate.create).toHaveBeenCalledWith({
      data: {
        botId: 'bot-1',
        updateId: 41,
        updateType: 'message',
        payload: expect.objectContaining({
          update_id: 41,
          message: expect.objectContaining({
            message_id: 'message-1',
            text: 'hello',
          }),
        }),
      },
    });
    expect(axios.post).toHaveBeenCalledWith(
      'https://example.com/hook',
      expect.objectContaining({
        update_id: 41,
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Telegram-Bot-Api-Secret-Token': 'secret',
        }),
      }),
    );
    expect(prisma.botApiUpdate.updateMany).toHaveBeenCalledWith({
      where: {
        botId: 'bot-1',
        updateId: 41,
        consumedAt: null,
      },
      data: {
        consumedAt: expect.any(Date),
      },
    });
  });

  it('skips callback query publication when callback_query is not allowed', async () => {
    (prisma.bot.findUnique as jest.Mock).mockResolvedValue({
      webhookUrl: 'https://example.com/hook',
      apiWebhookSecret: 'secret',
      apiAllowedUpdates: ['message'],
    });
    (prisma.botCallbackQuery.findUnique as jest.Mock).mockResolvedValue({
      id: 'callback-1',
      botId: 'bot-1',
      userId: 'user-1',
      messageId: 'message-1',
      callbackData: 'accept',
    });

    await botApiCompatibilityService.publishCallbackQueryUpdate('bot-1', 'callback-1');

    expect(prisma.botApiUpdate.create).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('marks webhook-delivered callback query updates as consumed', async () => {
    (prisma.bot.findUnique as jest.Mock).mockResolvedValue({
      webhookUrl: 'https://example.com/hook',
      apiWebhookSecret: 'secret',
      apiAllowedUpdates: ['callback_query'],
    });
    (prisma.botCallbackQuery.findUnique as jest.Mock).mockResolvedValue({
      id: 'callback-1',
      botId: 'bot-1',
      userId: 'user-1',
      messageId: 'message-1',
      callbackData: 'accept',
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      username: 'user',
      displayName: 'User',
    });
    (prisma.message.findUnique as jest.Mock).mockResolvedValue({
      id: 'message-1',
      content: 'hello',
      createdAt: new Date('2026-03-28T10:00:00Z'),
      type: 'TEXT',
      sender: {
        id: 'user-2',
        username: 'sender',
        displayName: 'Sender',
      },
      bot: null,
      chat: {
        id: 'chat-1',
        type: 'PRIVATE',
        name: null,
      },
      linkPreview: null,
    });
    (prisma.bot.update as jest.Mock).mockResolvedValue({
      lastUpdateId: 42,
    });

    await botApiCompatibilityService.publishCallbackQueryUpdate('bot-1', 'callback-1');

    expect(prisma.botApiUpdate.create).toHaveBeenCalledWith({
      data: {
        botId: 'bot-1',
        updateId: 42,
        updateType: 'callback_query',
        payload: expect.objectContaining({
          update_id: 42,
          callback_query: expect.objectContaining({
            id: 'callback-1',
            data: 'accept',
          }),
        }),
      },
    });
    expect(prisma.botApiUpdate.updateMany).toHaveBeenCalledWith({
      where: {
        botId: 'bot-1',
        updateId: 42,
        consumedAt: null,
      },
      data: {
        consumedAt: expect.any(Date),
      },
    });
  });

  it('stores inline query results when answered', async () => {
    (prisma.bot.findUnique as jest.Mock).mockResolvedValue({
      id: 'bot-1',
      token: 'bot-token',
      commands: [],
    });
    (prisma.botInlineQuery.findUnique as jest.Mock).mockResolvedValue({
      id: 'inline-1',
      botId: 'bot-1',
    });

    const results = [{ type: 'article', id: '1', title: 'Result' }];
    const response = await botApiCompatibilityService.answerInlineQuery('bot-token', 'inline-1', results);

    expect(prisma.botInlineQuery.update).toHaveBeenCalledWith({
      where: { id: 'inline-1' },
      data: {
        answered: true,
        results,
      },
    });
    expect(response).toEqual({ ok: true, result: true });
  });

  it('stores callback query answer text when answered', async () => {
    (prisma.bot.findUnique as jest.Mock).mockResolvedValue({
      id: 'bot-1',
      token: 'bot-token',
      commands: [],
    });
    (prisma.botCallbackQuery.findUnique as jest.Mock).mockResolvedValue({
      id: 'callback-1',
      botId: 'bot-1',
    });

    const response = await botApiCompatibilityService.answerCallbackQuery(
      'bot-token',
      'callback-1',
      'Done',
    );

    expect(prisma.botCallbackQuery.update).toHaveBeenCalledWith({
      where: { id: 'callback-1' },
      data: {
        answered: true,
        answerText: 'Done',
      },
    });
    expect(response).toEqual({ ok: true, result: true });
  });
});
