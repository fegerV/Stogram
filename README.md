# 🚀 Stogram - Modern PWA Messenger

<div align="center">

[![Stogram_logo](https://s3.iimg.su/s/31/th_gDR2WHgxsYtJ8dedtLK18pvduN1dnk8QEonQ95Ii.png)](https://iimg.su/i/DR2WHg).

**A modern, feature-rich Progressive Web Application (PWA) messenger built with React and Node.js**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6.svg)](https://www.typescriptlang.org/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

**Stogram** is a modern messaging platform that combines the best features of popular messengers like Telegram with cutting-edge web technologies. Built as a Progressive Web Application, Stogram works seamlessly across all devices and platforms, offering a native app-like experience directly in your browser.

### Why Stogram?

- 🌐 **Cross-Platform**: Works on desktop, mobile, and tablet - anywhere with a modern browser
- 📱 **PWA Technology**: Install on any device like a native app
- 🔒 **Secure**: End-to-end encryption ready with JWT authentication and bcrypt password hashing
- ⚡ **Real-Time**: WebSocket-based instant messaging with Socket.IO
- 🎥 **Rich Media**: Video and audio calls powered by WebRTC
- 💾 **Offline Support**: Service Workers enable offline functionality
- 🎨 **Modern UI**: Clean, intuitive design inspired by Telegram
- 🔧 **Extensible**: Well-structured codebase for easy customization

---

## ✨ Features

### 🔐 Authentication & Security

- **Email/Password Registration**: Secure account creation with validation
- **Login System**: Username or email-based authentication
- **JWT Tokens**: Secure, stateless authentication
- **Password Security**: Bcrypt hashing with configurable rounds
- **Session Management**: Automatic token refresh and validation
- **Rate Limiting**: Protection against brute force attacks

### 💬 Messaging

- **Real-Time Messages**: Instant delivery using WebSockets
- **Private Chats**: One-on-one conversations
- **Group Chats**: Multi-user group messaging
- **Channels**: Broadcast messages to many users
- **Message Types**: Text, images, videos, audio, files, voice messages
- **File Sharing**: Upload and share files up to 10MB
- **Message Editing**: Edit sent messages
- **Message Deletion**: Remove messages for yourself or everyone
- **Reply Function**: Reply to specific messages
- **Typing Indicators**: See when others are typing
- **Read Receipts**: Track message delivery and read status
- **Message Search**: Find messages across all chats

### 📞 Voice & Video Calls

- **Audio Calls**: High-quality voice communication
- **Video Calls**: Face-to-face video conversations
- **WebRTC Technology**: Peer-to-peer connection for low latency
- **Call Controls**: Mute/unmute microphone, enable/disable video
- **Call History**: Track incoming, outgoing, and missed calls
- **Group Calls**: Multi-participant audio/video calls (coming soon)

### 👥 User Management

- **User Profiles**: Customizable display name, avatar, and bio
- **User Status**: Online, Offline, Away, Do Not Disturb
- **Last Seen**: Track when users were last active
- **Contact Management**: Add and organize contacts
- **User Search**: Find users by username, email, or display name
- **Profile Pictures**: Upload and display avatars

### 🎨 User Interface

- **Modern Design**: Clean, Telegram-inspired interface
- **Responsive Layout**: Adapts to any screen size
- **Dark Mode Ready**: Easy to implement theme switching
- **Smooth Animations**: Polished transitions and effects
- **Emoji Support**: Full emoji integration
- **File Previews**: Preview images and videos inline
- **Notification System**: Toast notifications for events
- **Loading States**: Skeleton screens and spinners

### 🔔 Notifications

- **Push Notifications**: Browser push notifications (PWA)
- **Message Alerts**: Instant notification of new messages
- **Call Notifications**: Ring when receiving calls
- **Customizable**: Control notification preferences

### 🌐 Progressive Web App

- **Installable**: Add to home screen on any device
- **Offline Mode**: Access cached content without internet
- **Fast Loading**: Service Worker caching strategies
- **App-like Experience**: Full-screen mode, native gestures
- **Auto Updates**: Seamless application updates

---

## 🛠 Technology Stack

### Frontend

- **React 18**: Modern UI library with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **Socket.IO Client**: Real-time WebSocket communication
- **Axios**: HTTP client for API requests
- **React Router**: Client-side routing
- **Lucide React**: Beautiful icon set
- **React Hot Toast**: Elegant notification system
- **date-fns**: Modern date utility library
- **Workbox**: Service Worker management for PWA

### Backend

- **Node.js**: JavaScript runtime
- **Express**: Web application framework
- **TypeScript**: Type-safe server development
- **Socket.IO**: Real-time bidirectional communication
- **Prisma**: Modern ORM for database management
- **PostgreSQL**: Robust relational database
- **Redis**: In-memory data store for sessions and caching
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing
- **Multer**: File upload handling
- **Zod**: Schema validation
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing

### DevOps & Infrastructure

- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Web server and reverse proxy
- **Git**: Version control

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │    Mobile    │  │   Desktop    │      │
│  │     PWA      │  │     PWA      │  │     PWA      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                          │                                   │
│                    WebSocket + HTTP                          │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                  Application Layer                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Express.js Server                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │    │
│  │  │   REST   │  │ Socket.IO│  │  WebRTC Signal   │  │    │
│  │  │   API    │  │  Server  │  │     Server       │  │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│           │                │                   │             │
│     ┌─────┴────┐     ┌─────┴─────┐      ┌─────┴──────┐     │
│     │   Auth   │     │  Messages │      │    Calls   │     │
│     │ Service  │     │  Service  │      │   Service  │     │
│     └──────────┘     └───────────┘      └────────────┘     │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                     Data Layer                               │
│  ┌──────────────┐    ┌─────────┐    ┌──────────────┐       │
│  │  PostgreSQL  │    │  Redis  │    │ File Storage │       │
│  │   Database   │    │  Cache  │    │   (Uploads)  │       │
│  └──────────────┘    └─────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

```
User
├── id (UUID, PK)
├── email (unique)
├── username (unique)
├── password (hashed)
├── displayName
├── avatar
├── bio
├── status (enum)
├── lastSeen
└── timestamps

Chat
├── id (UUID, PK)
├── name
├── type (PRIVATE|GROUP|CHANNEL)
├── avatar
├── description
└── timestamps

ChatMember
├── id (UUID, PK)
├── userId (FK → User)
├── chatId (FK → Chat)
├── role (OWNER|ADMIN|MEMBER)
└── joinedAt

Message
├── id (UUID, PK)
├── content
├── type (enum)
├── senderId (FK → User)
├── chatId (FK → Chat)
├── replyToId (FK → Message)
├── fileUrl
├── fileName
├── fileSize
├── isEdited
├── isDeleted
└── timestamps

Call
├── id (UUID, PK)
├── chatId (FK → Chat)
├── initiatorId (FK → User)
├── type (AUDIO|VIDEO)
├── status (enum)
├── startedAt
└── endedAt

Contact
├── id (UUID, PK)
├── userId (FK → User)
├── contactId (FK → User)
├── nickname
└── createdAt
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL 15+ (if running without Docker)
- Redis (optional, for session management)

### Local Development

1. **Clone the repository**

```bash
git clone <repository-url>
cd stogram
```

2. **Install dependencies**

```bash
npm run install:all
```

3. **Set up environment variables**

Server (.env):
```bash
cp server/.env.example server/.env
# Edit server/.env with your configuration
```

Client (.env):
```bash
cp client/.env.example client/.env
# Edit client/.env with your configuration
```

4. **Start PostgreSQL and Redis**

```bash
docker-compose up -d postgres redis
```

5. **Set up the database**

```bash
cd server
npx prisma migrate dev
npx prisma generate
cd ..
```

6. **Start development servers**

```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Docker Deployment

1. **Configure environment variables**

```bash
cp .env.example .env
# Edit .env file with production settings
```

2. **Build and start containers**

```bash
docker-compose up -d --build
```

3. **Access the application**

- Application: http://localhost
- API: http://localhost:3001

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 📚 Documentation

- **[User Guide](./USER_GUIDE.md)**: Complete guide for end users
- **[Deployment Guide](./DEPLOYMENT.md)**: Production deployment instructions
- **[API Documentation](./docs/API.md)**: REST API endpoints reference
- **[Socket Events](./docs/SOCKET_EVENTS.md)**: WebSocket events documentation
- **[Development Guide](./docs/DEVELOPMENT.md)**: Contributing and development setup

---

## 📸 Screenshots

### Login & Registration
<div align="center">
  <img src="https://via.placeholder.com/400x300/0088cc/ffffff?text=Login+Screen" alt="Login" width="400"/>
  <img src="https://via.placeholder.com/400x300/0088cc/ffffff?text=Register+Screen" alt="Register" width="400"/>
</div>

### Chat Interface
<div align="center">
  <img src="https://via.placeholder.com/800x500/0088cc/ffffff?text=Chat+Interface" alt="Chat Interface"/>
</div>

### Video Call
<div align="center">
  <img src="https://via.placeholder.com/800x500/0088cc/ffffff?text=Video+Call" alt="Video Call"/>
</div>

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Design inspired by Telegram
- Icons by Lucide
- Built with love using React and Node.js

---

## 📞 Support

- 📧 Email: support@stogram.com
- 💬 Discord: [Join our community](https://discord.gg/stogram)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/stogram/issues)

---

<div align="center">
  <p>Made with ❤️ by the Stogram Team</p>
  <p>⭐ Star us on GitHub if you like this project!</p>
</div>
