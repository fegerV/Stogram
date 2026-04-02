export interface TelegramBotCommandConfig {
  command: string;
  description: string;
}

export const DEFAULT_TELEGRAM_BOT_COMMANDS: TelegramBotCommandConfig[] = [
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

export const buildStartConnectedText = (firstName?: string) =>
  `Welcome back, ${firstName || 'there'}!\n\nYour Stogram account is connected.\n\nUse /help to see all available commands.`;

export const buildStartDisconnectedText = (firstName?: string) =>
  `Welcome to Stogram Bot, ${firstName || 'there'}!\n\nTo connect your Stogram account, use /connect.\n\nOr visit the Stogram web app to link your account.`;

export const buildHelpText = (botUsername?: string | null) =>
  `*Stogram Bot Commands*\n\n`
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
  + `Type @${botUsername || 'stogrambot'} in any chat to search your chats inline.`;

export const buildNotifyUsageText = () =>
  '*Notification Settings*\n\nUsage: /notify [on|off]\n\nExample: /notify on';

export const buildConnectUsageText = () =>
  '*Connect Your Account*\n\nTo connect your Stogram account, provide your username or email:\n\nUsage: /connect [username|email]';
