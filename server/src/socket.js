import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from './config/env.js';
import Merchant from './models/Merchant.js';
import logger from './config/logger.js';

export function initSocket(httpServer, app) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const slug = socket.handshake.query?.slug;
    const token = socket.handshake.auth?.token;

    if (slug) {
      socket.slug = slug;
      return next();
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        socket.admin = decoded;
        return next();
      } catch {
        return next(new Error('Invalid token'));
      }
    }

    next(new Error('Authentication required'));
  });

  io.on('connection', async (socket) => {
    if (socket.slug) {
      socket.join(`merchant:${socket.slug}`);
      logger.info(`[Socket] Customer connected: ${socket.slug}`);
    } else if (socket.admin) {
      socket.join(`merchant:${socket.admin.merchantId}`);
      try {
        const merchant = await Merchant.findById(socket.admin.merchantId).select('slug');
        if (merchant) {
          socket.join(`merchant:${merchant.slug}`);
        }
      } catch {
        // ignore
      }
      logger.info(`[Socket] Admin connected: ${socket.admin.name} (${socket.admin.merchantId})`);
    }

    socket.on('disconnect', () => {
      if (socket.slug) {
        logger.info(`[Socket] Customer disconnected: ${socket.slug}`);
      } else if (socket.admin) {
        logger.info(`[Socket] Admin disconnected: ${socket.admin.name}`);
      }
    });
  });

  app.set('io', io);
  return io;
}
