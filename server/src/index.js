import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import { connectDB } from './config/db.js';
import env from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import merchantRoutes from './routes/merchant.js';
import adminRoutes from './routes/admin.js';
import midtransRoutes from './routes/midtrans.js';
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
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

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

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/merchant', merchantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/midtrans', midtransRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();

  cron.schedule('*/5 * * * *', () => {
    cleanupExpiredQueues();
  });

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    console.log('Cron job: cleanup expired queues every 5 minutes');
  });
}

start();

export default app;
