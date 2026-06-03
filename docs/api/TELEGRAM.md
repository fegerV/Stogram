# Telegram Integration

Stogram provides a Telegram admin bridge for managing your messenger instance via Telegram bots.

## Overview

The Telegram integration allows:
- Receiving notifications in Telegram
- Managing users and chats via Telegram commands
- Bridge messages between Telegram and Stogram

## Setup

1. Create a bot via [@BotFather](https://t.me/botfather) on Telegram
2. Get your bot token
3. Configure the environment variable:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot |
| `/stats` | Get instance statistics |
| `/users` | List active users |
| `/broadcast <message>` | Send a broadcast to all users |
| `/help` | Show available commands |

## Configuration

Environment variables for Telegram integration:

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token |
| `TELEGRAM_ADMIN_IDS` | Comma-separated list of admin Telegram user IDs |

## Security

- Only authorized admin IDs can execute commands
- All commands are logged for audit
- Rate limiting is applied to prevent spam