# Changelog

All notable changes to Stogram will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### 🎉 Initial Release

#### Added
- **Authentication & Security**
  - Email/password registration system
  - Login with username or email
  - JWT token-based authentication
  - Bcrypt password hashing
  - Rate limiting protection
  - CORS and security headers

- **Messaging Features**
  - Real-time messaging with WebSocket
  - Private chats (1-on-1)
  - Group chats
  - Message types: text, image, video, audio, file
  - File upload up to 10MB
  - Message editing
  - Message deletion
  - Reply to messages
  - Typing indicators

- **User Management**
  - User profiles with avatar and bio
  - User status (Online, Offline, Away, DND)
  - Last seen tracking
  - Contact management
  - User search functionality
  - Profile customization

- **Voice & Video Calls**
  - Audio calls with WebRTC
  - Video calls with WebRTC
  - Call controls (mute, video toggle)
  - Call status tracking
  - Call history

- **User Interface**
  - Modern, Telegram-inspired design
  - Responsive layout for all devices
  - Chat list with search
  - Real-time message display
  - User avatars and status indicators
  - Loading states and error handling
  - Toast notifications

- **Progressive Web App**
  - PWA manifest
  - Service Worker with offline support
  - Installable on all platforms
  - App icons and splash screens
  - Optimized caching strategies

- **Backend Infrastructure**
  - RESTful API with Express
  - WebSocket server with Socket.IO
  - PostgreSQL database
  - Prisma ORM
  - File storage system
  - Comprehensive error handling
  - Health check endpoints

- **DevOps**
  - Docker support
  - Docker Compose configuration
  - Nginx reverse proxy setup
  - Environment-based configuration
  - Production-ready build scripts

- **Documentation**
  - Comprehensive README
  - User guide
  - Deployment guide
  - API documentation
  - Features roadmap
  - Contributing guidelines

#### Technical Details
- React 18 with TypeScript
- Node.js with Express
- PostgreSQL 15 database
- Socket.IO for real-time communication
- Prisma ORM for database management
- TailwindCSS for styling
- Zustand for state management
- Vite for fast development

### Known Issues
- Group calls limited to 2 participants
- File upload size limited to 10MB
- No message search functionality yet

---

## [Unreleased]

### In Development for v1.1

#### Added
- **Dark Mode** 🎨
  - Three theme modes: Light, Dark, and System (auto-detect)
  - Theme toggle component with visual switcher
  - Persistent theme selection (localStorage)
  - Automatic system theme detection and updates
  - Full dark theme support for auth pages (Login, Register)
  - Dark theme support for chat interface (ChatList, ChatPage)
  - Updated Tailwind configuration with dark mode classes
  - Improved scrollbar styling for both themes

### Planned for v1.1
- Voice message recording
- Message reactions (emoji)
- Two-factor authentication
- Email verification
- Password reset functionality
- Message forwarding
- Advanced search
- Push notifications

---

## Version History

- **v1.0.0** - Initial release (2024-01-15)

---

For more details about planned features, see [FEATURES.md](FEATURES.md).
