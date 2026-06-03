# n8n Integration

Stogram provides native integration with [n8n](https://n8n.io) for workflow automation.

## Available Actions

### List Chats

Retrieve all chats from Stogram:

```
GET /api/n8n/chats
Authorization: Bearer <api_key>
```

### Send Message

Send a message through n8n:

```
POST /api/n8n/send
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "chatId": "chat-uuid",
  "text": "Message from n8n workflow"
}
```

### Get Messages

Retrieve messages from a chat:

```
GET /api/n8n/chats/:chatId/messages
Authorization: Bearer <api_key>
```

## Authentication

Configure an API key in Stogram settings and use it as a Bearer token in all n8n HTTP requests.

## Example Workflow

1. **Trigger**: Webhook or schedule
2. **HTTP Request**: Call Stogram API
3. **Process**: Transform data as needed
4. **Action**: Send message, create chat, etc.