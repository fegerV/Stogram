# New Features Implementation

This document describes the newly implemented features in the Stogram messaging application.

## 🎯 Implemented Features

### 1. Voice Messages (Голосовые сообщения)
- **Client:** `VoiceRecorder` component for recording audio messages
- **Server:** Audio processing with duration and waveform generation
- **Features:**
  - Real-time recording with duration display
  - Visual waveform generation
  - Send/cancel controls
  - Audio playback with waveform visualization using WaveSurfer.js

**Usage:**
```typescript
import { VoiceRecorder } from './components/VoiceRecorder';

<VoiceRecorder 
  onSend={(blob) => sendVoiceMessage(blob)}
  onCancel={() => setRecording(false)}
/>
```

### 2. Email Confirmation (Подтверждение email)
- **Server:** Email service with nodemailer
- **Features:**
  - Verification email sent on registration
  - Email verification page with token validation
  - Resend verification option
  - User model updated with `emailVerified` flag

**API Endpoints:**
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/resend-verification` - Resend verification email

### 3. Message Reactions (Реакции на сообщения)
- **Client:** `ReactionPicker` component with emoji selection
- **Server:** Reaction controller and database model
- **Features:**
  - Quick reactions (👍, ❤️, 😂, 😮, 😢, 🔥, 🎉)
  - Full emoji picker
  - Real-time reaction updates via WebSocket
  - Grouped reactions display

**API Endpoints:**
- `POST /api/messages/:messageId/reactions` - Add reaction
- `DELETE /api/messages/:messageId/reactions/:emoji` - Remove reaction
- `GET /api/messages/:messageId/reactions` - Get reactions

### 4. Scheduled Messages (Запланированные сообщения)
- **Client:** `ScheduleMessageModal` component
- **Server:** Scheduler service with node-cron
- **Features:**
  - Quick schedule options (10min, 30min, 1hr, etc.)
  - Custom date/time picker
  - Background job to send scheduled messages
  - Visual indication of scheduled messages

**Implementation:**
- Messages with `scheduledFor` date are marked as not sent
- Cron job runs every minute to check and send due messages
- Real-time delivery via WebSocket when time arrives

### 5. Image Compression (Сжатие изображений)
- **Client:** Browser-based compression with `browser-image-compression`
- **Server:** Server-side compression with Sharp library
- **Features:**
  - Automatic compression on upload (max 2MB, 1920px)
  - Preserves image quality
  - Reduces bandwidth and storage

**Configuration:**
```typescript
// Client-side
await compressImage(file, 2, 1920);

// Server-side (automatic in mediaService)
```

### 6. GIF Support (GIF поддержка)
- **Type:** Added `GIF` to MessageType enum
- **Server:** GIF validation and processing
- **Features:**
  - Upload and send GIF files
  - Inline GIF display
  - Size validation (max 5MB)

### 7. Video Preview (Превью видео)
- **Client:** Thumbnail generation from video files
- **Server:** FFmpeg-based thumbnail generation
- **Features:**
  - Automatic thumbnail creation at 1 second mark
  - Thumbnail displayed before video loads
  - Video duration extraction

**Implementation:**
```typescript
const thumbnail = await generateVideoThumbnail(videoFile);
```

### 8. Audio Visualization (Визуализация аудио)
- **Component:** `AudioVisualizer` with WaveSurfer.js
- **Features:**
  - Waveform visualization
  - Play/pause controls
  - Progress tracking
  - Time display
  - Pre-computed waveform data from server

### 9. Inline Media Viewer (Встроенный просмотр медиа)
- **Component:** `MediaViewer` modal
- **Features:**
  - Full-screen media viewing
  - Image and video support
  - Navigation between multiple media
  - Keyboard shortcuts (Esc, Arrow keys)
  - Download option

**Usage:**
```typescript
import { MediaViewer } from './components/MediaViewer';

<MediaViewer
  isOpen={isOpen}
  onClose={() => setOpen(false)}
  mediaUrl={url}
  mediaType="image"
  items={mediaItems}
  currentIndex={0}
/>
```

### 10. Dark Theme (Темная тема)
- **Implementation:** TailwindCSS dark mode
- **Store:** Theme store with system preference detection
- **Features:**
  - Light/Dark/System modes
  - Persistent theme preference
  - Automatic system theme detection
  - Theme sync with backend

**API Endpoint:**
- `PATCH /api/users/theme` - Update user theme preference

### 11. Push Notifications (Push уведомления)
- **Service Worker:** `/public/sw.js`
- **Features:**
  - Browser push notifications
  - New message notifications
  - Call notifications
  - Notification actions (Open/Close)
  - Web Push protocol with VAPID keys

**Setup:**
1. Generate VAPID keys:
```bash
cd server
npm run generate-vapid-keys
```

2. Add keys to `.env`:
```
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_EMAIL=mailto:admin@stogram.com
```

3. Subscribe to notifications:
```typescript
import { subscribeToPushNotifications } from './utils/pushNotifications';

await subscribeToPushNotifications(vapidPublicKey);
```

## 📦 New Dependencies

### Server
- `sharp` - Image processing
- `fluent-ffmpeg` - Video processing
- `nodemailer` - Email sending
- `node-cron` - Task scheduling
- `web-push` - Push notifications

### Client
- `wavesurfer.js` - Audio visualization
- `browser-image-compression` - Client-side image compression
- `emoji-picker-react` - Emoji picker
- `react-player` - Video player

## 🗄️ Database Changes

New Prisma schema additions:

```prisma
model User {
  emailVerified Boolean   @default(false)
  verificationToken String?
  pushSubscription String?
  theme         String?   @default("light")
  reactions     Reaction[]
}

model Message {
  thumbnailUrl String?
  duration    Int?
  waveform    String?
  scheduledFor DateTime?
  isSent      Boolean     @default(false)
  reactions   Reaction[]
}

model Reaction {
  id          String    @id @default(uuid())
  messageId   String
  userId      String
  emoji       String
  createdAt   DateTime  @default(now())
  
  message     Message   @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([messageId, userId, emoji])
}
```

## 🚀 Getting Started

1. **Update dependencies:**
```bash
cd server && npm install
cd ../client && npm install
```

2. **Run database migration:**
```bash
cd server
npx prisma migrate dev --name add_new_features
npx prisma generate
```

3. **Generate VAPID keys:**
```bash
cd server
npm run generate-vapid-keys
# Add output to .env file
```

4. **Configure email (optional):**
Add SMTP settings to `server/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

5. **Start development servers:**
```bash
npm run dev
```

## 📝 Environment Variables

Add these to `server/.env`:

```env
# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Stogram <noreply@stogram.com>

# Push Notifications
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_EMAIL=mailto:admin@stogram.com
```

## 🧪 Testing Features

1. **Voice Messages:** Click mic icon in message input
2. **Email Verification:** Register new account, check email
3. **Reactions:** Hover over message, click reaction button
4. **Scheduled Messages:** Click schedule icon, select time
5. **Image Compression:** Upload large image, check file size
6. **GIF Support:** Upload .gif file
7. **Video Preview:** Upload video, see thumbnail
8. **Audio Visualization:** Send voice message or audio file
9. **Media Viewer:** Click on image/video in chat
10. **Dark Theme:** Toggle in settings or use system preference
11. **Push Notifications:** Allow notifications, receive test message

## 🔧 Customization

### Adjust Compression Settings
```typescript
// client/src/utils/mediaCompression.ts
const compressImage = async (
  file: File,
  maxSizeMB = 2,  // Change this
  maxWidthOrHeight = 1920  // Change this
)
```

### Modify Scheduler Interval
```typescript
// server/src/services/schedulerService.ts
cron.schedule('* * * * *', () => {  // Every minute
  checkScheduledMessages();
});
```

### Customize Quick Reactions
```typescript
// client/src/components/ReactionPicker.tsx
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉'];
```

## 🐛 Troubleshooting

**FFmpeg not found:**
```bash
# Install FFmpeg
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

**Email not sending:**
- Check SMTP credentials
- Enable "Less secure app access" for Gmail
- Use App Password for Gmail
- Check firewall/network settings

**Push notifications not working:**
- Ensure HTTPS in production
- Check VAPID keys are set
- Verify service worker is registered
- Check browser console for errors

## 📄 License

MIT
