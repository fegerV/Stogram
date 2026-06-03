# Stogram 📨

Modern PWA messenger with video/audio calls, end-to-end encryption, bot API, and Telegram integration.

<p align="center">
  <img src="Stogram_logo_192.png" alt="Stogram Logo" width="192" height="192" />
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-development">Development</a>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/version-2.0.0-blue.svg" alt="Version"></a>
  <a href="#"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
</p>

---

## ✨ Features

| Category | Capabilities |
|----------|-------------|
| 💬 **Chats & Groups** | Private chats, group chats, channels, secret chats, folders, pinned messages |
| 📹 **Calls** | Audio/video calls (1-on-1 & group), WebRTC, screen sharing, recording |
| 🔒 **Security** | E2E encryption (RSA-2048 + AES-256-GCM), 2FA (TOTP), rate limiting, IP blocking |
| 🤖 **Bots** | Bot API, inline keyboards, callback queries, webhooks, n8n integration |
| 📱 **Cross-platform** | PWA (React), mobile app (React Native – in progress), desktop (planned) |
| 🎨 **UI** | Telegram-like design, dark/light themes, theme customizer, reactive UI |
| ⚡ **Performance** | Redis caching, virtualized lists, lazy loading, infinite scroll |
| 📊 **Analytics** | User analytics, bot analytics, system metrics, exportable dashboards |
| 🔗 **Integrations** | Telegram admin bridge, n8n webhooks, webhook API with HMAC signing |

## 🚀 Quick Start

### Docker (recommended)

```bash
docker-compose up -d
```

### Manual setup

```bash
# Clone the repository
git clone https://github.com/fegerV/Stogram.git
cd stogram

# Install dependencies
npm run install:all

# Set up environment
cp server/.env.example server/.env
cp client/.env.example client/.env

# Run database migrations
cd server && npx prisma migrate dev && cd ..

# Start development servers
npm run dev
```

### One-command Ubuntu install

```bash
./install-ubuntu.sh --test
./start-dev.sh
```

> 📖 See [docs/getting-started/installation.md](docs/getting-started/installation.md) for detailed instructions.

## 🚢 Deployment

| Platform | Status | Guide |
|----------|--------|-------|
| [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new) | ✅ Supported | [docs/deployment/vercel.md](docs/deployment/vercel.md) |
| [![Deploy to Render](https://render.com/button)](https://render.com/deploy) | ✅ Supported | [docs/deployment/render.md](docs/deployment/render.md) |
| [![Deploy on Railway](https://railway.app/button)](https://railway.app) | ✅ Recommended | [docs/deployment/railway.md](docs/deployment/railway.md) |

## 🛠 Tech Stack

### Frontend (`client/`)
- **React 18** with TypeScript
- **Vite** for bundling
- **TailwindCSS** for styling
- **Zustand** for state management
- **Socket.IO Client** for real-time
- **Workbox** for PWA/Service Worker

### Backend (`server/`)
- **Node.js** + **Express**
- **TypeScript**
- **Prisma ORM** (PostgreSQL + SQLite)
- **Socket.IO** for WebSocket
- **Redis** for caching & pub/sub
- **JWT** + **bcrypt** for auth
- **Sharp** + **FFmpeg** for media processing

### Mobile (`mobile/`)
- **React Native 0.73**
- **React Navigation**
- **WebRTC** for calls

## 📁 Project Structure

```
stogram/
├── client/          # React PWA frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API & socket services
│   │   ├── store/        # Zustand stores
│   │   └── utils/        # Utilities
│   └── public/           # Static assets
├── server/          # Express backend
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── socket/       # WebSocket handlers
│   │   └── utils/        # Utilities
│   └── prisma/           # Database schema & migrations
├── mobile/          # React Native app (WIP)
├── docs/            # Documentation
│   ├── getting-started/
│   ├── deployment/
│   ├── api/
│   └── guides/
└── tests/           # Playwright E2E tests
```

## 📚 Documentation

| Section | Contents |
|---------|----------|
| 📖 **Getting Started** | [Installation](docs/getting-started/installation.md), [Quick Start](docs/getting-started/quick-start.md) |
| 🚢 **Deployment** | [Vercel](docs/deployment/vercel.md), [Render](docs/deployment/render.md), [Railway](docs/deployment/railway.md) |
| 🔌 **API** | [Bot API](docs/api/BOT_API.md), [Telegram Integration](docs/api/TELEGRAM.md), [Chat Settings](CHAT_SETTINGS_API.md) |
| 📱 **Mobile** | [Status](mobile/IMPLEMENTATION_STATUS.md), [Features](mobile/FEATURES_CHECKLIST.md) |
| 🤝 **Contributing** | [CONTRIBUTING.md](CONTRIBUTING.md) |
| 🔒 **Security** | [SECURITY.md](SECURITY.md) |
| 🗺️ **Roadmap** | [ROADMAP.md](ROADMAP.md) |
| 📋 **Changelog** | [CHANGELOG.md](CHANGELOG.md) |

## 👨‍💻 Development

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL (or SQLite for development)
- Redis (optional, for caching)

### Scripts

```bash
npm run dev           # Start both client & server in dev mode
npm run build         # Build for production
npm run test:e2e      # Run Playwright E2E tests
npm run docker:up     # Start Docker environment
npm run docker:down   # Stop Docker environment
```

### Client scripts

```bash
cd client
npm run dev           # Vite dev server (port 5173)
npm run build         # Production build
npm run test          # Vitest unit tests
```

### Server scripts

```bash
cd server
npm run dev           # Dev server (port 3001)
npm run build         # TypeScript compilation
npm run test          # Run tests
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema to DB
```

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.