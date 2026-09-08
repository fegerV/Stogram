"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildConnectUsageText = exports.buildNotifyUsageText = exports.buildHelpText = exports.buildStartDisconnectedText = exports.buildStartConnectedText = exports.DEFAULT_TELEGRAM_BOT_COMMANDS = void 0;
exports.DEFAULT_TELEGRAM_BOT_COMMANDS = [
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
const buildStartConnectedText = (firstName) => `Welcome back, ${firstName || 'there'}!\n\nYour Stogram account is connected.\n\nUse /help to see all available commands.`;
exports.buildStartConnectedText = buildStartConnectedText;
const buildStartDisconnectedText = (firstName) => `Welcome to Stogram Bot, ${firstName || 'there'}!\n\nTo connect your Stogram account, use /connect.\n\nOr visit the Stogram web app to link your account.`;
exports.buildStartDisconnectedText = buildStartDisconnectedText;
const buildHelpText = (botUsername) => `*Stogram Bot Commands*\n\n`
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
exports.buildHelpText = buildHelpText;
const buildNotifyUsageText = () => '*Notification Settings*\n\nUsage: /notify [on|off]\n\nExample: /notify on';
exports.buildNotifyUsageText = buildNotifyUsageText;
const buildConnectUsageText = () => '*Connect Your Account*\n\nTo connect your Stogram account, provide your username or email:\n\nUsage: /connect [username|email]';
exports.buildConnectUsageText = buildConnectUsageText;
//# sourceMappingURL=telegramBotTexts.js.map