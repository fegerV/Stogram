# System Architecture

## Overview

Stogram follows a client-server architecture with three tiers:

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Web Client    │     │   Mobile App    │     │  3rd Party   │
│  (React PWA)    │     │ (React Native)  │     │ (Telegram/n8n)│
└────────┬────────┘     └────────┬────────┘     └──────┬───────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │     Express API       │
                    │   + Socket.IO (WS)    │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │      PostgreSQL       │
                    │     + Redis Cache     │
                    └───────────────────────┘
```

## Web Client (`client/`)

- **Framework**: React 18 with TypeScript
- **Bundler**: Vite
- **Styling**: TailwindCSS
- **State**: Zustand stores
- **Real-time**: Socket.IO client
- **PWA**: Workbox service worker

## Backend Server (`server/`)

- **Runtime**: Node.js + Express
- **Language**: TypeScript
- **ORM**: Prisma (PostgreSQL/SQLite)
- **Auth**: JWT + bcrypt
- **Real-time**: Socket.IO
- **Queue/Events**: Redis pub/sub

## Mobile App (`mobile/`)

- **Framework**: React Native 0.73
- **Navigation**: React Navigation
- **State**: Zustand
- **Calls**: WebRTC

## Key Components

### Authentication Flow

1. User registers/logs in via REST API
2. Server issues JWT token
3. Client stores token and attaches to all requests
4. Socket.IO connections authenticated via JWT

### Real-time Messaging

1. User sends message via Socket.IO
2. Server validates and stores in DB
3. Redis pub/sub broadcasts to relevant chat members
4. Connected clients receive and render in real-time

### WebRTC Calls

1. Signaling via Socket.IO
2. Peer-to-peer connection established
3. Media streams exchanged directly between clients