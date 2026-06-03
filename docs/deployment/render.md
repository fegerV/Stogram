# Deploy on Render

Render provides full support for WebSocket connections, making it a great choice for Stogram.

[![Deploy to Render](https://render.com/button)](https://render.com/deploy)

## Deploy Backend

1. Create a **Web Service** on Render
2. Connect your GitHub repository
3. Set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variables

## Deploy Frontend

1. Create a **Static Site** on Render
2. Connect your GitHub repository
3. Set:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

## Environment Variables

### Server

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (use Render's managed PostgreSQL) |
| `JWT_SECRET` | Strong random secret for JWT |
| `REDIS_URL` | Redis connection string (optional) |
| `NODE_ENV` | `production` |
| `PORT` | Port (Render sets this automatically) |

### Client

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL of your deployed server |
| `VITE_WS_URL` | WebSocket URL (same as API URL) |

## Managed PostgreSQL

Render offers managed PostgreSQL databases. Create one and use its connection string as `DATABASE_URL`.

## WebSocket Support

Render fully supports WebSocket connections — no additional configuration needed.