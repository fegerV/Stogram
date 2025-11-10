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
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

export { prisma };

// Security headers with Helmet - Enhanced with CSP and HSTS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'blob:'],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global IP-based rate limiting for all API routes (1000 requests per 15 minutes)
app.use('/api', lenientIPRateLimit);

app.use('/uploads', express.static('uploads'));

// Serve static client files in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const clientDistPath = path.join(__dirname, '../../client/dist');
  
  console.log(`📂 Serving static files from: ${clientDistPath}`);
  
  app.use(express.static(clientDistPath, {
    maxAge: '1y',
    etag: true,
    lastModified: true
  }));
  
  // For any non-API routes, serve the React app
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io') && !req.path.startsWith('/uploads')) {
      const indexPath = path.join(clientDistPath, 'index.html');
      console.log(`📄 Serving React app for path: ${req.path} -> ${indexPath}`);
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`❌ Error serving file: ${err.message}`);
          res.status(500).send('Internal Server Error');
        }
      });
    }
  });
}

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

initSocketHandlers(io);
initScheduler();

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Stogram server running on ${HOST}:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});

export { io };
