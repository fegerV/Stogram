jest.mock('../prisma', () => ({
  __esModule: true,
  default: {
    chatMember: {
      findFirst: jest.fn(),
    },
  },
}));

import prisma from '../prisma';
import { assertCanSendMessage, assertCanPinMessage } from '../permissions';

describe('chat permission helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks regular members from sending directly to channels', async () => {
    (prisma.chatMember.findFirst as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      chatId: 'channel-1',
      role: 'MEMBER',
      chat: {
        id: 'channel-1',
        type: 'CHANNEL',
      },
    });

    await expect(assertCanSendMessage('channel-1', 'user-1')).rejects.toThrow(
      'Only owners and admins can send messages to channels'
    );
  });

  it('allows owners and admins to send directly to channels', async () => {
    (prisma.chatMember.findFirst as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      chatId: 'channel-1',
      role: 'ADMIN',
      chat: {
        id: 'channel-1',
        type: 'CHANNEL',
      },
    });

    await expect(assertCanSendMessage('channel-1', 'user-1')).resolves.toMatchObject({
      role: 'ADMIN',
    });
  });

  it('requires admin role for chat pin operations', async () => {
    (prisma.chatMember.findFirst as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      chatId: 'chat-1',
      role: 'MEMBER',
      chat: {
        id: 'chat-1',
        type: 'GROUP',
      },
    });

    await expect(assertCanPinMessage('chat-1', 'user-1')).rejects.toThrow(
      'Only owners and admins can perform this action'
    );
  });
});
