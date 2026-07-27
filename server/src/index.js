import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { connectDB, isDBConnected } from './config/db.js';
import logger from './config/logger.js';
import env from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate } from './middleware/auth.js';
import merchantRoutes from './routes/merchant.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notification.js';
import uploadRoutes from './routes/upload.js';
import { initSocket } from './socket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(helmet.xssFilter());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.hidePoweredBy());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.CORS_ORIGIN === '*') {
      callback(null, true);
      return;
    }
    const allowed = env.CORS_ORIGIN.split(',');
    const ok = allowed.some(a => {
      if (origin === a) return true;
      try {
        const u = new URL(a);
        if (origin.endsWith(`.${u.host}`)) return true;
      } catch {}
      return false;
    });
    callback(null, ok);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
});

app.use(limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

app.use('/api/admin/login', loginLimiter);

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Terlalu banyak percobaan daftar. Silakan coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/admin/register', registerLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

app.get('/api/health', (_req, res) => {
  const dbOk = isDBConnected();
  const status = dbOk ? 'ok' : 'degraded';
  res.json({ status, db: dbOk ? 'connected' : 'disconnected', timestamp: new Date().toISOString() });
  logger.info('Health check', { status, db: dbOk ? 'connected' : 'disconnected' });
});

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/upload', authenticate, uploadRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server, app);

  server.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
}

start();

export default app;
