import {
  buildConnectUsageText,
  buildHelpText,
  buildNotifyUsageText,
  buildStartConnectedText,
  buildStartDisconnectedText,
  DEFAULT_TELEGRAM_BOT_COMMANDS,
} from '../services/telegramBotTexts';

describe('telegramBotTexts', () => {
  it('exposes the default command set', () => {
    expect(DEFAULT_TELEGRAM_BOT_COMMANDS.map((command) => command.command)).toEqual([
      'start',
      'help',
      'status',
      'chats',
      'unread',
      'search',
      'notify',
      'connect',
      'disconnect',
    ]);
  });

  it('builds contextual start texts', () => {
    expect(buildStartConnectedText('Viktor')).toContain('Welcome back, Viktor');
    expect(buildStartDisconnectedText('Viktor')).toContain('Welcome to Stogram Bot, Viktor');
  });

  it('includes bot username in help text', () => {
    expect(buildHelpText('stogram_helper_bot')).toContain('@stogram_helper_bot');
  });

  it('returns notify and connect usage text', () => {
    expect(buildNotifyUsageText()).toContain('/notify [on|off]');
    expect(buildConnectUsageText()).toContain('/connect [username|email]');
  });
});
