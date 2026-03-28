jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    verify: jest.fn(),
  },
}));

jest.mock('../utils/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      update: jest.fn(),
    },
    chatMember: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    message: {
      findFirst: jest.fn(),
    },
    call: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../services/telegramService', () => ({
  __esModule: true,
  default: {
    sendNotification: jest.fn(),
    syncMessageToTelegram: jest.fn(),
  },
}));

import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { initSocketHandlers } from '../socket';

type Handler = (...args: any[]) => any;

describe('socket handlers', () => {
  let consoleLogSpy: jest.SpyInstance;
  const use = jest.fn();
  const on = jest.fn();
  const emit = jest.fn();
  const ioToEmit = jest.fn();
  const ioTo = jest.fn(() => ({ emit: ioToEmit }));

  const join = jest.fn();
  const socketEmit = jest.fn();
  const socketToEmit = jest.fn();
  const socketTo = jest.fn(() => ({ emit: socketToEmit }));

  const socketHandlers: Record<string, Handler> = {};

  const io = {
    use,
    on,
    emit,
    to: ioTo,
  } as any;

  const socket = {
    id: 'socket-1',
    handshake: {
      auth: {
        token: 'token-1',
      },
    },
    join,
    emit: socketEmit,
    to: socketTo,
    on: jest.fn((event: string, handler: Handler) => {
      socketHandlers[event] = handler;
      return socket;
    }),
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    Object.keys(socketHandlers).forEach((key) => delete socketHandlers[key]);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-1' });
    (prisma.user.update as jest.Mock).mockResolvedValue({});
    (prisma.chatMember.findMany as jest.Mock).mockResolvedValue([]);

    initSocketHandlers(io);

    const authMiddleware = use.mock.calls[0][0];
    const next = jest.fn();
    await authMiddleware(socket, next);
    expect(next).toHaveBeenCalled();

    const connectionHandler = on.mock.calls.find(([event]) => event === 'connection')?.[1];
    await connectionHandler(socket);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('rejects typing events for users outside the chat', async () => {
    (prisma.chatMember.findFirst as jest.Mock).mockResolvedValue(null);

    await socketHandlers['message:typing']({ chatId: 'chat-1', isTyping: true });

    expect(socketEmit).toHaveBeenCalledWith('error', { message: 'Not a member of this chat' });
    expect(socketTo).not.toHaveBeenCalledWith('chat:chat-1');
  });

  it('emits read receipts only for accessible messages', async () => {
    (prisma.message.findFirst as jest.Mock).mockResolvedValue({
      id: 'message-1',
      chatId: 'chat-1',
    });

    await socketHandlers['message:read']({ messageId: 'message-1' });

    expect(ioTo).toHaveBeenCalledWith('chat:chat-1');
    expect(ioToEmit).toHaveBeenCalledWith('message:read', {
      messageId: 'message-1',
      userId: 'user-1',
    });
  });

  it('rejects ending a call that is already closed', async () => {
    (prisma.call.findUnique as jest.Mock).mockResolvedValue({
      id: 'call-1',
      chatId: 'chat-1',
      status: 'ENDED',
      chat: {
        members: [{ userId: 'user-1' }],
      },
    });

    await socketHandlers['call:end']({ callId: 'call-1' });

    expect(socketEmit).toHaveBeenCalledWith('error', { message: 'Call is already ended' });
  });
});
