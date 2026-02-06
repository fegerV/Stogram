import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initSocketHandlers } from './socket';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import prisma from './utils/prisma';
import { initScheduler } from './services/schedulerService';
import { lenientIPRateLimit } from './middleware/ipRateLimit';

dotenv.config();

const app = express();
const httpServer = createServer(app);
/** Parses CLIENT_URL into an array of allowed origins for CORS */
function parseAllowedOrigins(): string[] | string {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return clientUrl.split(',').map((url) => url.trim());
}

const allowedOrigins = parseAllowedOrigins();

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

export { prisma };

// Serve uploaded files BEFORE helmet/cors to avoid cross-origin restrictions
// These are user-uploaded media files that need to be accessible from the frontend (different origin)
app.use('/uploads', cors({ origin: '*' }), express.static('uploads', {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h cache
  },
}));

// Security headers with Helmet - Enhanced with CSP and HSTS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", ...(Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins])],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'blob:', 'https:'],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global IP-based rate limiting for all API routes (1000 requests per 15 minutes)
app.use('/api', lenientIPRateLimit);

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

initSocketHandlers(io);
initScheduler();

// Render automatically sets PORT, use it or fallback to 3001
const PORT = Number(process.env.PORT) || 3001;
// Always listen on 0.0.0.0 in production (required by Render)
const HOST = '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Stogram server running on ${HOST}:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  // Explicitly log that server is ready for Render health checks
  console.log(`✅ Server is ready to accept connections on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});

export { io };
