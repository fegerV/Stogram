jest.mock('../services/botApiCompatibilityService', () => ({
  __esModule: true,
  default: {
    setWebhook: jest.fn(),
    getUpdates: jest.fn(),
  },
}));

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    message: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../index', () => ({
  io: {
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
  },
}));

import { Request, Response } from 'express';
import botApiCompatibilityService from '../services/botApiCompatibilityService';
import { getUpdates, setWebhook } from '../controllers/botApiCompatibilityController';

describe('botApiCompatibilityController', () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const response = { json, status } as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes allowed_updates to setWebhook', async () => {
    (botApiCompatibilityService.setWebhook as jest.Mock).mockResolvedValue({ ok: true, result: true });

    const request = {
      params: { token: 'bot-token' },
      body: {
        url: 'https://example.com/webhook',
        secret_token: 'secret',
        allowed_updates: ['message', 'callback_query'],
      },
    } as unknown as Request;

    await setWebhook(request, response);

    expect(botApiCompatibilityService.setWebhook).toHaveBeenCalledWith(
      'bot-token',
      'https://example.com/webhook',
      'secret',
      ['message', 'callback_query'],
    );
    expect(json).toHaveBeenCalledWith({ ok: true, result: true });
  });

  it('returns 400 when getUpdates is called while webhook is active', async () => {
    (botApiCompatibilityService.getUpdates as jest.Mock).mockRejectedValue(
      new Error('Cannot use getUpdates while webhook is active')
    );

    const request = {
      method: 'GET',
      params: { token: 'bot-token' },
      query: {},
    } as unknown as Request;

    await getUpdates(request, response);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      ok: false,
      description: 'Cannot use getUpdates while webhook is active',
    });
  });
});
