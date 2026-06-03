# Bot API

Stogram provides a Bot API for creating and managing automated bots within the messenger.

## Creating a Bot

Bots can be created via the web interface or API.

### Via API

```
POST /api/bots
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "name": "MyBot",
  "description": "A helpful bot"
}
```

### Response

```json
{
  "id": "bot-uuid",
  "name": "MyBot",
  "token": "bot-token-here",
  "description": "A helpful bot"
}
```

## Bot Token

Each bot gets a unique token for authentication. Use this token in the `Authorization` header:

```
Authorization: Bearer <bot_token>
```

## Sending Messages

### Send a message as bot

```
POST /api/bots/send
Authorization: Bearer <bot_token>
Content-Type: application/json

{
  "chatId": "chat-uuid",
  "text": "Hello from bot!"
}
```

### Send with inline keyboard

```json
{
  "chatId": "chat-uuid",
  "text": "Choose an option:",
  "replyMarkup": {
    "inlineKeyboard": [
      [{ "text": "Option 1", "callbackData": "opt1" }],
      [{ "text": "Option 2", "callbackData": "opt2" }]
    ]
  }
}
```

## Bot Commands

Register commands that users can invoke with `/`:

```
POST /api/bots/commands
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "commands": [
    { "command": "start", "description": "Start the bot" },
    { "command": "help", "description": "Show help" }
  ]
}
```

## Webhooks

Bots can receive updates via webhooks. Configure a webhook URL:

```
POST /api/bots/webhook
Authorization: Bearer <bot_token>
Content-Type: application/json

{
  "url": "https://myservice.com/webhook"
}
```

## Inline Mode

Bots can provide inline results when users type `@botname`:

```
POST /api/bots/inline-query
Authorization: Bearer <bot_token>
Content-Type: application/json

{
  "query": "search term",
  "results": [
    { "id": "1", "title": "Result 1", "description": "..." }
  ]
}
```

## Rate Limits

- 30 messages per second per bot
- 1000 webhook deliveries per hour per bot

## Full API Reference

For complete API documentation, see the [Chat Settings API](../../CHAT_SETTINGS_API.md) document.