# Stogram

Stogram is a messenger project with:

- `client/` - React + Vite PWA
- `server/` - Node.js + Express + Prisma backend
- `mobile/` - React Native client in progress

The project already includes chat, folders, profile/settings flows, private calls, bot integrations, Telegram/n8n admin integrations, and an internal Bot API compatibility layer.

## Current Status

- Web client: active
- Backend API: active
- Mobile app: in progress
- Desktop-style web layout: active in the client

## Quick Start

Requirements:

- Node.js 18+
- npm
- PostgreSQL

Install dependencies:

```bash
npm install
cd client && npm install
cd ../server && npm install
```

Set up environment files:

- root: [`.env.example`](/c:/Project/Stogram/.env.example)
- client: [`client/.env.example`](/c:/Project/Stogram/client/.env.example)
- server: [`server/.env.example`](/c:/Project/Stogram/server/.env.example)

Run in development:

```bash
npm run dev
```

Build everything:

```bash
npm run build
```

## Database

The backend uses Prisma.

Generate Prisma client:

```bash
cd server
npm run prisma:generate
```

Apply schema changes locally:

```bash
cd server
npm run prisma:push
```

For production deploys with migration history:

```bash
cd server
npx prisma migrate deploy
```

Latest tracked migration:

- [`server/prisma/migrations/0003_bot_api_compatibility/migration.sql`](/c:/Project/Stogram/server/prisma/migrations/0003_bot_api_compatibility/migration.sql)

## Useful Scripts

Root:

- `npm run dev`
- `npm run build`
- `npm run test:e2e`

Client:

- `npm run dev`
- `npm run build`
- `npm run test`

Server:

- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run prisma:generate`
- `npm run prisma:push`

## Bots And Integrations

Stogram currently has three integration directions:

1. Internal bots via the Stogram bot API and webhook/runtime flow
2. Telegram admin integration
3. `n8n` integration

Helpful docs:

- [`BOTS_USAGE_GUIDE.md`](/c:/Project/Stogram/BOTS_USAGE_GUIDE.md)
- [`docs/api/BOT_API.md`](/c:/Project/Stogram/docs/api/BOT_API.md)
- [`docs/api/TELEGRAM.md`](/c:/Project/Stogram/docs/api/TELEGRAM.md)
- [`docs/deployment/VERCEL_SETUP.md`](/c:/Project/Stogram/docs/deployment/VERCEL_SETUP.md)

## Documentation

Main documentation index:

- [`docs/README.md`](/c:/Project/Stogram/docs/README.md)

Other useful files:

- [`ROADMAP.md`](/c:/Project/Stogram/ROADMAP.md)
- [`CHANGELOG.md`](/c:/Project/Stogram/CHANGELOG.md)
- [`INSTALLATION.md`](/c:/Project/Stogram/INSTALLATION.md)
- [`SECURITY.md`](/c:/Project/Stogram/SECURITY.md)

## Notes

- The repository still contains historical reports and audit documents. They were kept, but the main entry documentation was cleaned up.
- Some older markdown files may still contain outdated analysis snapshots; treat the new `README` and docs index as the current starting points.
