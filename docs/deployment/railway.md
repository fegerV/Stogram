# Deploy on Railway

Railway is the recommended platform for deploying Stogram due to its excellent support for WebSocket, managed PostgreSQL, and Redis.

[![Deploy on Railway](https://railway.app/button)](https://railway.app)

## One-Click Deploy

1. Click the button above or go to [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Railway will automatically detect the project structure

## Manual Setup

### Create a New Project

1. Click **New Project** → **Deploy from GitHub repo**
2. Select your Stogram repository
3. Configure the project:

### Server Service

- **Root Directory**: `server`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

### Client Service

- **Root Directory**: `client`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Start Command**: (static hosting via Railway)

## Environment Variables

### Server

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Railway PostgreSQL plugin provides this |
| `JWT_SECRET` | Generate a strong random secret |
| `REDIS_URL` | Railway Redis plugin provides this (optional) |
| `NODE_ENV` | `production` |
| `PORT` | Railway sets this automatically |

### Client

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Your Railway server domain |
| `VITE_WS_URL` | Same as API URL |

## Plugins

Enable these Railway plugins for full functionality:

- **PostgreSQL** — Main database
- **Redis** — Caching and pub/sub (optional but recommended)

## Domains

Railway provides a `.railway.app` domain by default. You can add a custom domain in the Railway dashboard.

## Deployment Config

A `railway.json` configuration file is included in the project root for automatic Railway detection.