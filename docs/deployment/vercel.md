# Deploy on Vercel

Stogram can be deployed on Vercel using the Serverless Functions adapter for the backend and static hosting for the client.

> **Note:** Vercel has limitations with WebSocket connections. For full WebSocket support, consider [Railway](railway.md) or [Render](render.md).

## Deploy Client

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Connect your GitHub repository
2. Set the **Root Directory** to `client`
3. Set **Build Command** to `npm run build`
4. Set **Output Directory** to `dist`
5. Add environment variables from `client/.env.example`

## Deploy Server

1. Create a new Vercel project
2. Set the **Root Directory** to `server`
3. Set **Build Command** to `npm run build`
4. Set **Output Command** to `npm start`
5. Add environment variables from `server/.env.example`

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `NODE_ENV` | Set to `production` |

## Limitations

- WebSocket connections may not work reliably on Vercel's serverless infrastructure
- For full real-time features, prefer Railway or a VPS with Docker Compose