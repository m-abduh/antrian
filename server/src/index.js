import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import { connectDB, isDBConnected } from './config/db.js';
import logger from './config/logger.js';
import env from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import merchantRoutes from './routes/merchant.js';
import adminRoutes from './routes/admin.js';
import midtransRoutes from './routes/midtrans.js';
import notificationRoutes from './routes/notification.js';
import { cleanupExpiredQueues } from './cron/cleanupQueue.js';

const app = express();

app.use(helmet());
app.use(helmet.xssFilter());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.hidePoweredBy());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());

app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
});

app.use(limiter);

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many webhook requests' },
});

app.use('/api/midtrans', webhookLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

app.use('/api/admin/login', loginLimiter);

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

app.use('/api/merchant', merchantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/midtrans', midtransRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();

  cron.schedule('*/5 * * * *', () => {
    cleanupExpiredQueues();
  });

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    logger.info('Cron job: cleanup expired queues every 5 minutes');
  });
}

start();

export default app;
