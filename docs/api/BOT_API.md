# Stogram Bot API

Stogram includes an internal Bot API compatibility layer inspired by the Telegram Bot API.

Base pattern:

```text
/api/bot<TOKEN>/<METHOD>
```

Example:

```text
POST /api/bot123456abcdef/sendMessage
```

This API is implemented in:

- [`server/src/routes/botApiCompatibility.ts`](/c:/Project/Stogram/server/src/routes/botApiCompatibility.ts)
- [`server/src/controllers/botApiCompatibilityController.ts`](/c:/Project/Stogram/server/src/controllers/botApiCompatibilityController.ts)
- [`server/src/services/botApiCompatibilityService.ts`](/c:/Project/Stogram/server/src/services/botApiCompatibilityService.ts)

## Important Concepts

- A bot must exist in Stogram and have a valid bot token.
- A bot can only send messages to chats where it is installed.
- Updates can be consumed either through `getUpdates` or through `setWebhook`.
- Internal runtime webhooks and Telegram-like Bot API webhooks are related but not identical:
  - internal runtime webhooks receive Stogram event payloads such as `message.created`
  - Bot API webhooks receive Telegram-like `update` objects

## Authentication

The bot token is part of the URL path:

```text
/api/bot<TOKEN>/getMe
```

There is no `Authorization: Bearer ...` header for this API.

## Supported Methods

### Bot identity

- `getMe`

Example:

```bash
curl -X GET "https://your-host/api/bot<TOKEN>/getMe"
```

### Webhook management

- `setWebhook`
- `deleteWebhook`
- `getWebhookInfo`

Example:

```bash
curl -X POST "https://your-host/api/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/stogram-bot-webhook",
    "secret_token": "my-secret"
  }'
```

Delete webhook:

```bash
curl -X POST "https://your-host/api/bot<TOKEN>/deleteWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "drop_pending_updates": true
  }'
```

### Updates

- `getUpdates`

Example:

```bash
curl -X GET "https://your-host/api/bot<TOKEN>/getUpdates?offset=0&limit=100"
```

Returned result format:

```json
{
  "ok": true,
  "result": [
    {
      "update_id": 1,
      "message": {
        "message_id": "message-id",
        "date": 1774560000,
        "chat": {
          "id": "chat-id",
          "type": "group",
          "title": "Project chat"
        },
        "from": {
          "id": "bot-id",
          "is_bot": true,
          "first_name": "Stogram Bot",
          "username": "stogrambot"
        },
        "text": "Hello"
      }
    }
  ]
}
```

### Commands

- `setMyCommands`
- `getMyCommands`

Example:

```bash
curl -X POST "https://your-host/api/bot<TOKEN>/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      { "command": "start", "description": "Start bot" },
      { "command": "help", "description": "Show help" }
    ]
  }'
```

### Menu button

- `setChatMenuButton`
- `getChatMenuButton`

Example:

```bash
curl -X POST "https://your-host/api/bot<TOKEN>/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{
    "menu_button": {
      "type": "commands"
    }
  }'
```

### Sending messages

- `sendMessage`
- `sendPhoto`
- `sendDocument`
- `sendVideo`
- `sendAudio`

Example `sendMessage`:

```bash
curl -X POST "https://your-host/api/bot<TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "chat-id",
    "text": "Hello from Stogram Bot API"
  }'
```

Example with inline keyboard:

```bash
curl -X POST "https://your-host/api/bot<TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "chat-id",
    "text": "Choose action",
    "reply_markup": {
      "inline_keyboard": [
        [
          { "text": "Open", "url": "https://example.com" },
          { "text": "Ping", "callbackData": "ping" }
        ]
      ]
    }
  }'
```

Example `sendPhoto`:

```bash
curl -X POST "https://your-host/api/bot<TOKEN>/sendPhoto" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "chat-id",
    "photo": "https://example.com/image.jpg",
    "caption": "Picture"
  }'
```

## Editing and deleting messages

- `editMessageText`
- `deleteMessage`

Important:

- the bot can edit or delete only its own messages
- the message must belong to the same `chat_id`

Example:

```bash
curl -X POST "https://your-host/api/bot<TOKEN>/editMessageText" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "chat-id",
    "message_id": "message-id",
    "text": "Updated text"
  }'
```

## Callback and inline query answers

- `answerCallbackQuery`
- `answerInlineQuery`

Example `answerCallbackQuery`:

```bash
curl -X POST "https://your-host/api/bot<TOKEN>/answerCallbackQuery" \
  -H "Content-Type: application/json" \
  -d '{
    "callback_query_id": "callback-id",
    "text": "Done"
  }'
```

Example `answerInlineQuery`:

```bash
curl -X POST "https://your-host/api/bot<TOKEN>/answerInlineQuery" \
  -H "Content-Type: application/json" \
  -d '{
    "inline_query_id": "inline-query-id",
    "results": [
      {
        "type": "article",
        "id": "1",
        "title": "Example",
        "input_message_content": {
          "message_text": "Inline result"
        }
      }
    ]
  }'
```

## Webhook Payload Format

When Bot API webhook mode is enabled through `setWebhook`, Stogram sends Telegram-like update objects.

Current update types:

- `message`
- `edited_message`
- `callback_query`
- `inline_query`

Current message payload support:

- `text`
- `caption`
- `photo`
- `document`
- `video`
- `audio`
- `reply_markup.inline_keyboard`

## Errors

The API returns Telegram-like objects with `ok: false`.

Example:

```json
{
  "ok": false,
  "description": "Invalid bot token"
}
```

Common cases:

- invalid token -> `401`
- missing resource -> `404`
- bad payload or unsupported action -> `400`

## Operational Notes

- Internal bot webhook deliveries have retry/backoff logic and are logged in the bot management UI.
- Bot API updates are persisted through Prisma and survive process restarts.
- Bot installation into chats is required before message sending.

## Current Limitations

This layer is Telegram-like, not full Telegram Bot API parity yet.

Not fully covered yet:

- `sendVoice`
- `sendAnimation`
- `sendSticker`
- `sendMediaGroup`
- `forwardMessage`
- `copyMessage`
- `editMessageCaption`
- `editMessageReplyMarkup`
- advanced inline result types
- full chat member lifecycle updates

## Recommended Flow

1. Create bot in Stogram UI.
2. Copy token.
3. Install bot into one or more chats.
4. Choose delivery mode:
   - `getUpdates`
   - or `setWebhook`
5. Set commands and menu button.
6. Send messages and process updates.

## Related Docs

- [`README.md`](/c:/Project/Stogram/README.md)
- [`docs/README.md`](/c:/Project/Stogram/docs/README.md)
- [`BOTS_USAGE_GUIDE.md`](/c:/Project/Stogram/BOTS_USAGE_GUIDE.md)
