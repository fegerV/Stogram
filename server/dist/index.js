"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_1 = require("./socket");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const prisma_1 = __importDefault(require("./utils/prisma"));
exports.prisma = prisma_1.default;
const schedulerService_1 = require("./services/schedulerService");
const ipRateLimit_1 = require("./middleware/ipRateLimit");
const authConfig_1 = require("./utils/authConfig");
const telegramBotService_1 = __importDefault(require("./services/telegramBotService"));
dotenv_1.default.config();
if (process.env.NODE_ENV !== 'test') {
    (0, authConfig_1.getJwtSecret)();
}
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
/** Parses CLIENT_URL into an array of allowed origins for CORS */
function parseAllowedOrigins() {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    return clientUrl.split(',').map((url) => url.trim());
}
const allowedOrigins = parseAllowedOrigins();
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});
exports.io = io;
// Security headers with Helmet - Enhanced with CSP and HSTS
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Global IP-based rate limiting for all API routes (1000 requests per 15 minutes)
app.use('/api', ipRateLimit_1.lenientIPRateLimit);
app.use('/api', routes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use(errorHandler_1.errorHandler);
(0, socket_1.initSocketHandlers)(io);
(0, schedulerService_1.initScheduler)();
telegramBotService_1.default.initialize().catch((err) => {
    console.error('Failed to initialize Telegram bot service:', err);
});
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
    await prisma_1.default.$disconnect();
    httpServer.close(() => {
        console.log('HTTP server closed');
    });
});
//# sourceMappingURL=index.js.map