# Quick Start

Get Stogram running in under 5 minutes.

## Docker (fastest)

```bash
git clone https://github.com/fegerV/Stogram.git
cd stogram
docker-compose up -d
```

Access:
- **Web app**: http://localhost:5173
- **API**: http://localhost:3001

## One-Command Ubuntu Install

```bash
git clone https://github.com/fegerV/Stogram.git
cd stogram
./install-ubuntu.sh --test
./start-dev.sh
```

## Manual (any platform)

```bash
git clone https://github.com/fegerV/Stogram.git
cd stogram
npm run install:all
cp server/.env.example server/.env
cp client/.env.example client/.env
cd server && npx prisma generate && npx prisma migrate dev && cd ..
npm run dev
```

## First Run

1. Open http://localhost:5173
2. Register a new account
3. Create a chat and start messaging

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in dev mode |
| `npm run build` | Build everything for production |
| `npm run test:e2e` | Run Playwright E2E tests |
| `docker-compose up -d` | Start Docker environment |
| `docker-compose down` | Stop Docker environment |