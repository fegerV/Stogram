# Chat Settings API Documentation

## Overview

This document describes the new chat settings API endpoints for managing pinned messages and notification levels.

## Database Changes

### New Fields

- **Chat.pinnedMessageId** (String?, unique): ID of the pinned message in the chat
- **ChatSettings.notificationLevel** (NotificationLevel): Notification preference for the chat

### New Enum

```typescript
enum NotificationLevel {
  ALL      // Receive all notifications
  MENTIONS // Only receive notifications for mentions
  MUTED    // No notifications
}
```

## API Endpoints

### Chat Pin Message

#### Pin a Message
```http
PATCH /api/chats/:chatId/pin
Content-Type: application/json

{
  "messageId": "string"
}
```

**Response:**
```json
{
  "chat": {
    "id": "string",
    "pinnedMessageId": "string",
    "pinnedMessage": {
      "id": "string",
      "content": "string",
      "sender": { ... }
    },
    ...
  },
  "message": "Message pinned successfully"
}
```

**Permissions:** Only OWNER and ADMIN can pin messages.

#### Unpin a Message
```http
DELETE /api/chats/:chatId/pin
```

**Response:**
```json
{
  "chat": {
    "id": "string",
    "pinnedMessageId": null,
    "pinnedMessage": null,
    ...
  },
  "message": "Message unpinned successfully"
}
```

**Permissions:** Only OWNER and ADMIN can unpin messages.

### Chat Settings

#### Get Chat Settings
```http
GET /api/chat-settings/:chatId
```

**Response:**
```json
{
  "settings": {
    "id": "string",
    "userId": "string",
    "chatId": "string",
    "isMuted": false,
    "isFavorite": false,
    "isArchived": false,
    "notificationLevel": "ALL",
    "folderId": null,
    "unreadCount": 0,
    "lastReadMessageId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update Chat Settings
```http
PUT /api/chat-settings/:chatId
Content-Type: application/json

{
  "isMuted": false,
  "isFavorite": true,
  "notificationLevel": "MENTIONS",
  "folderId": null
}
```

#### Update Notification Level
```http
PATCH /api/chat-settings/:chatId/notifications
Content-Type: application/json

{
  "level": "MENTIONS"  // "ALL" | "MENTIONS" | "MUTED"
}
```

**Response:**
```json
{
  "settings": { ... },
  "message": "Notification level updated successfully"
}
```

#### Mute Chat (Legacy)
```http
POST /api/chat-settings/:chatId/mute
```

Sets `notificationLevel` to `MUTED` and `isMuted` to `true`.

#### Unmute Chat (Legacy)
```http
POST /api/chat-settings/:chatId/unmute
```

Sets `notificationLevel` to `ALL` and `isMuted` to `false`.

## Socket Events

### Client -> Server

#### Pin Message
```javascript
socket.emit('chat:pin-message', { chatId, messageId });
```

#### Unpin Message
```javascript
socket.emit('chat:unpin-message', { chatId });
```

#### Update Notification Level
```javascript
socket.emit('chat:update-notifications', { chatId, level: 'MENTIONS' });
```

### Server -> Client

#### Pin Updated
```javascript
socket.on('chat:pin-updated', ({ chat }) => {
  // chat.pinnedMessageId and chat.pinnedMessage updated
});
```

#### Notification Updated
```javascript
socket.on('chat:notification-updated', ({ settings }) => {
  // settings.notificationLevel updated
});
```

## Frontend Implementation

### Components

1. **PinnedMessageBanner** - Displays pinned message at the top of chat
2. **ChatSettingsDrawer** - Drawer for managing chat notification settings

### Store Updates

The chat store now includes methods for:
- `pinMessage(chatId, messageId)`
- `unpinMessage(chatId)`
- `updateNotificationLevel(chatId, level)`

### UI Changes

1. **Chat List** - Shows mute icon (BellOff) when chat is muted, and pin icon when message is pinned
2. **Chat Window Header** - Shows unpin button when there's a pinned message
3. **Message Context Menu** - Shows "Pin" option for admins
4. **Chat Settings** - Accessible via settings icon in chat header

## Migration Notes

To apply the database migration:

```bash
cd server
npx prisma migrate deploy
```

Or for development:

```bash
cd server
npx prisma migrate dev
```

The migration will:
1. Create the `NotificationLevel` enum
2. Add `pinnedMessageId` column to `Chat` table
3. Add `notificationLevel` column to `ChatSettings` table with default value `ALL`
4. Create unique index on `Chat.pinnedMessageId`
5. Add foreign key constraint `Chat.pinnedMessageId -> Message.id`
