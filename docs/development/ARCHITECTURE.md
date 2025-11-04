# 🏗️ Stogram Architecture

This document describes the system architecture, design patterns, and technical decisions behind Stogram.

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Database Design](#database-design)
- [API Architecture](#api-architecture)
- [Real-time Communication](#real-time-communication)
- [Security Architecture](#security-architecture)
- [File Storage](#file-storage)
- [Caching Strategy](#caching-strategy)
- [Deployment Architecture](#deployment-architecture)

---

## 🌟 Overview

Stogram is built as a modern, scalable Progressive Web Application using a client-server architecture with real-time communication capabilities.

### Key Architectural Principles

1. **Separation of Concerns**: Clear separation between client, server, and data layers
2. **Scalability**: Designed to scale horizontally with load balancing
3. **Real-time First**: WebSocket-based real-time communication as primary channel
4. **Security by Design**: E2E encryption, secure authentication, and data protection
5. **Progressive Enhancement**: Works offline with service workers
6. **API-First**: Well-defined REST and WebSocket APIs
7. **Microservices Ready**: Modular service architecture

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │   Mobile     │  │   Desktop    │      │
│  │     PWA      │  │   React      │  │     PWA      │      │
│  │              │  │   Native     │  │              │      │
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
│     │   Auth   │     │ Messages  │      │   Calls    │     │
│     │  Service │     │  Service  │      │  Service   │     │
│     └──────────┘     └───────────┘      └────────────┘     │
│           │                │                   │             │
│     ┌─────┴────┐     ┌─────┴─────┐      ┌─────┴──────┐     │
│     │   E2E    │     │   Media   │      │   Bots     │     │
│     │Encryption│     │Processing │      │  Service   │     │
│     └──────────┘     └───────────┘      └────────────┘     │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                     Data Layer                               │
│  ┌──────────────┐    ┌─────────┐    ┌──────────────┐       │
│  │  PostgreSQL  │    │  Redis  │    │  File        │       │
│  │   Database   │    │  Cache  │    │  Storage     │       │
│  │              │    │         │    │              │       │
│  └──────────────┘    └─────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Action
    │
    ├─→ Client (React)
    │       │
    │       ├─→ State Management (Zustand)
    │       │
    │       ├─→ HTTP Request (Axios)
    │       │       │
    │       │       └─→ REST API (Express)
    │       │               │
    │       │               ├─→ Controller
    │       │               │       │
    │       │               │       └─→ Service Layer
    │       │               │               │
    │       │               │               ├─→ Database (Prisma)
    │       │               │               └─→ Cache (Redis)
    │       │               │
    │       │               └─→ Response
    │       │
    │       └─→ WebSocket (Socket.IO)
    │               │
    │               └─→ Socket Server
    │                       │
    │                       ├─→ Event Handler
    │                       │       │
    │                       │       └─→ Service Layer
    │                       │
    │                       └─→ Emit to Clients
    │
    └─→ Real-time Update
```

---

## 🛠️ Technology Stack

### Frontend

**Framework & Build**
- React 18.x - UI library with hooks and concurrent features
- TypeScript 5.x - Type-safe development
- Vite - Fast build tool and dev server

**Styling & UI**
- TailwindCSS - Utility-first CSS framework
- Lucide React - Icon library
- Custom themes system

**State Management**
- Zustand - Lightweight state management
- React Context - For app-wide state

**Communication**
- Axios - HTTP client
- Socket.IO Client - WebSocket communication
- WebRTC - Peer-to-peer calls

**PWA**
- Workbox - Service Worker tooling
- Web Push API - Push notifications
- IndexedDB - Offline storage

### Backend

**Runtime & Framework**
- Node.js 18+ - JavaScript runtime
- Express.js - Web application framework
- TypeScript - Type-safe server development

**Database & ORM**
- PostgreSQL 15+ - Primary database
- Prisma - Modern ORM
- Redis - Caching and sessions

**Real-time**
- Socket.IO - WebSocket server
- WebRTC - Video/audio calls

**Security**
- JWT - Authentication tokens
- bcrypt - Password hashing
- Helmet - Security headers
- CORS - Cross-origin protection

**Media Processing**
- Sharp - Image processing
- FFmpeg - Video processing
- Multer - File uploads

**Utilities**
- Zod - Schema validation
- date-fns - Date utilities
- node-cron - Task scheduling
- winston - Logging

### Infrastructure

**Containerization**
- Docker - Container platform
- Docker Compose - Multi-container orchestration

**Web Server**
- Nginx - Reverse proxy and static file serving

**Monitoring** (Planned)
- Prometheus - Metrics collection
- Grafana - Monitoring dashboards
- Sentry - Error tracking

---

## 🗄️ Database Design

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    User     │◄───────►│ ChatMember  │◄───────►│    Chat     │
└─────────────┘         └─────────────┘         └─────────────┘
      │                                                 │
      │                                                 │
      │                 ┌─────────────┐                │
      └────────────────►│   Message   │◄───────────────┘
                        └─────────────┘
                              │
                              │
                        ┌─────┴─────┐
                        │           │
                ┌───────▼──┐  ┌─────▼──────┐
                │MessageRead│  │Reaction    │
                └───────────┘  └────────────┘
```

### Core Tables

**Users**
```sql
- id (UUID, PK)
- email (unique)
- username (unique)
- password (hashed)
- displayName
- avatar
- bio
- status (enum: ONLINE, OFFLINE, AWAY, DND)
- publicKey (for E2E)
- encryptedPrivateKey (for E2E)
- createdAt, updatedAt
```

**Chats**
```sql
- id (UUID, PK)
- name
- type (enum: PRIVATE, GROUP, CHANNEL)
- avatar
- description
- isSecret (E2E enabled)
- encryptionKeyId
- createdAt, updatedAt
```

**Messages**
```sql
- id (UUID, PK)
- content
- type (enum: TEXT, IMAGE, VIDEO, AUDIO, FILE, VOICE)
- senderId (FK → User)
- chatId (FK → Chat)
- replyToId (FK → Message)
- fileUrl, fileName, fileSize
- isEncrypted, encryptedContent
- isEdited, isDeleted, isSilent
- mentions[], hashtags[]
- createdAt, updatedAt
```

### Indexing Strategy

```sql
-- Performance-critical indexes
CREATE INDEX idx_messages_chat_created ON messages(chatId, createdAt DESC);
CREATE INDEX idx_messages_sender ON messages(senderId);
CREATE INDEX idx_chat_members_user ON chat_members(userId);
CREATE INDEX idx_chat_members_chat ON chat_members(chatId);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Full-text search
CREATE INDEX idx_messages_content_fts ON messages USING gin(to_tsvector('english', content));
```

---

## 🔌 API Architecture

### REST API Structure

```
/api
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   ├── POST /refresh
│   └── GET  /me
├── /users
│   ├── GET    /
│   ├── GET    /:id
│   ├── PATCH  /:id
│   ├── DELETE /:id
│   └── GET    /search
├── /chats
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PATCH  /:id
│   ├── DELETE /:id
│   └── POST   /:id/members
├── /messages
│   ├── GET    /chat/:chatId
│   ├── POST   /
│   ├── PATCH  /:id
│   └── DELETE /:id
├── /files
│   ├── POST   /upload
│   └── GET    /:id
├── /calls
│   ├── POST   /initiate
│   ├── POST   /answer
│   └── POST   /end
└── /bots
    ├── GET    /
    ├── POST   /
    └── POST   /:id/webhook
```

### API Response Format

```typescript
// Success Response
{
  success: true,
  data: any,
  message?: string
}

// Error Response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

---

## 🔄 Real-time Communication

### WebSocket Events

**Client → Server**
```typescript
// Messages
'message:send'
'message:edit'
'message:delete'
'typing:start'
'typing:stop'

// Calls
'call:initiate'
'call:answer'
'call:reject'
'call:end'
'call:ice-candidate'

// Presence
'user:online'
'user:offline'
'user:status-change'
```

**Server → Client**
```typescript
// Messages
'message:new'
'message:edited'
'message:deleted'
'message:read'
'typing:user'

// Calls
'call:incoming'
'call:accepted'
'call:ended'
'call:signal'

// Presence
'user:status'
'user:last-seen'
```

---

## 🔒 Security Architecture

### Authentication Flow

```
1. User Login
   ├─→ Validate credentials (bcrypt)
   ├─→ Generate JWT (access + refresh)
   ├─→ Store refresh token in Redis
   └─→ Return tokens to client

2. Request with JWT
   ├─→ Extract token from header
   ├─→ Verify signature
   ├─→ Check expiration
   ├─→ Validate user exists
   └─→ Allow/Deny request

3. Token Refresh
   ├─→ Verify refresh token
   ├─→ Check Redis for validity
   ├─→ Generate new access token
   └─→ Return new token
```

### E2E Encryption Flow

```
1. Key Generation
   ├─→ Generate RSA-2048 key pair
   ├─→ Encrypt private key with user password
   ├─→ Store public key on server
   └─→ Store encrypted private key on server

2. Message Encryption
   ├─→ Generate random AES-256 key
   ├─→ Encrypt message with AES key
   ├─→ Encrypt AES key with recipient's public key
   └─→ Send encrypted message + encrypted key

3. Message Decryption
   ├─→ Decrypt AES key with private key
   ├─→ Decrypt message with AES key
   └─→ Display message
```

---

## 📁 File Storage

### Storage Strategy

```
uploads/
├── avatars/
│   └── {userId}-{timestamp}.{ext}
├── messages/
│   ├── images/
│   │   ├── originals/
│   │   └── thumbnails/
│   ├── videos/
│   │   ├── originals/
│   │   ├── thumbnails/
│   │   └── processed/
│   ├── audio/
│   └── files/
└── temp/
```

### File Processing Pipeline

```
Upload Request
    │
    ├─→ Validate file type & size
    │
    ├─→ Generate unique filename
    │
    ├─→ Save to disk
    │
    ├─→ Process file (compress/convert)
    │       │
    │       ├─→ Images: Sharp processing
    │       ├─→ Videos: FFmpeg processing
    │       └─→ Audio: Waveform generation
    │
    ├─→ Generate thumbnails
    │
    ├─→ Save metadata to database
    │
    └─→ Return file URL
```

---

## 💾 Caching Strategy

### Redis Cache Layers

```
1. Session Cache
   - JWT refresh tokens
   - User sessions
   - TTL: 7 days

2. User Data Cache
   - User profiles
   - Online status
   - TTL: 1 hour

3. Chat Data Cache
   - Recent messages
   - Chat metadata
   - TTL: 30 minutes

4. Rate Limiting
   - Request counts
   - TTL: 1 minute
```

### Cache Invalidation

```typescript
// On user update
cache.delete(`user:${userId}`)

// On message send
cache.delete(`chat:${chatId}:messages`)

// On chat update
cache.delete(`chat:${chatId}`)
cache.delete(`user:${userId}:chats`)
```

---

## 🚀 Deployment Architecture

### Docker Compose Setup

```yaml
services:
  nginx:        # Reverse proxy
  client:       # React frontend
  server:       # Express backend
  postgres:     # Database
  redis:        # Cache
```

### Scaling Strategy

```
┌────────────────┐
│ Load Balancer  │
└────────┬───────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌───▼──┐
│Server│  │Server│  ← Horizontal scaling
│  1   │  │  2   │
└───┬──┘  └───┬──┘
    │         │
    └────┬────┘
         │
    ┌────▼────┐
    │Database │
    │ Replica │
    └─────────┘
```

---

## 📊 Performance Considerations

### Frontend Optimizations
- Code splitting with React.lazy()
- Virtual scrolling for large lists
- Image lazy loading
- Service Worker caching
- Optimistic UI updates

### Backend Optimizations
- Database query optimization
- Redis caching
- Connection pooling
- Response compression
- Rate limiting

### Database Optimizations
- Proper indexing
- Query optimization
- Connection pooling
- Prepared statements
- Pagination

---

## 🔮 Future Architecture Plans

- **Microservices**: Split into separate services
- **Message Queue**: RabbitMQ/Kafka for async processing
- **CDN**: Static asset delivery
- **Multi-region**: Geographic distribution
- **Kubernetes**: Container orchestration
- **Service Mesh**: Istio for microservices communication

---

**[← Back to Documentation](../README.md)**
