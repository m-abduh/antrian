import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from './config/env.js';
import Merchant from './models/Merchant.js';
import logger from './config/logger.js';

const adminSockets = new Map();
const ipConnections = new Map();
const customerPerSlug = new Map();

const LIMITS = {
  perIP: 100,
  adminPerMerchant: 5,
  customerPerSlug: 200,
};

export function initSocket(httpServer, app) {
  const io = new Server(httpServer, {
    pingInterval: 25000,
    pingTimeout: 20000,
    cors: {
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
    },
  });

  io.use((socket, next) => {
    const ip = socket.handshake.address || socket.conn.remoteAddress;
    if ((ipConnections.get(ip) || 0) >= LIMITS.perIP) {
      return next(new Error('Too many connections from this IP'));
    }

    const slug = socket.handshake.query?.slug;
    const token = socket.handshake.auth?.token;

    if (slug) {
      if ((customerPerSlug.get(slug) || 0) >= LIMITS.customerPerSlug) {
        return next(new Error('Too many connections for this merchant'));
      }
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
    const ip = socket.handshake.address || socket.conn.remoteAddress;
    ipConnections.set(ip, (ipConnections.get(ip) || 0) + 1);

    if (socket.slug) {
      customerPerSlug.set(socket.slug, (customerPerSlug.get(socket.slug) || 0) + 1);
      socket.join(`merchant:${socket.slug}`);
      logger.info(`[Socket] Customer connected: ${socket.slug}`);
    } else if (socket.admin) {
      const adminId = socket.admin.id;
      const existing = adminSockets.get(adminId);
      if (existing && existing.id !== socket.id) {
        logger.info(`[Socket] Kicking old session for admin=${socket.admin.name} id=${existing.id.slice(0, 6)}`);
        existing.emit('kicked', 'Sesi baru terdeteksi, sesi ini ditutup');
        setTimeout(() => {
          try { existing.disconnect(); } catch {}
        }, 300);
      }
      adminSockets.set(adminId, socket);

      try {
        const merchant = await Merchant.findById(socket.admin.merchantId).select('slug');
        if (merchant) {
          socket.join(`merchant:${merchant.slug}`);
          logger.info(`[Socket] Admin connected: ${socket.admin.name} id=${socket.id.slice(0, 6)} joined=merchant:${merchant.slug}`);
        } else {
          logger.warn(`[Socket] Admin merchant not found: ${socket.admin.merchantId}`);
        }
      } catch (err) {
        logger.error(`[Socket] Admin merchant lookup failed: ${err.message}`);
      }
    }

    socket.on('disconnect', () => {
      const ipCount = ipConnections.get(ip) - 1;
      if (ipCount <= 0) ipConnections.delete(ip);
      else ipConnections.set(ip, ipCount);

      if (socket.slug) {
        const slugCount = customerPerSlug.get(socket.slug) - 1;
        if (slugCount <= 0) customerPerSlug.delete(socket.slug);
        else customerPerSlug.set(socket.slug, slugCount);
        logger.info(`[Socket] Customer disconnected: ${socket.slug}`);
      } else if (socket.admin) {
        if (adminSockets.get(socket.admin.id) === socket) {
          adminSockets.delete(socket.admin.id);
        }
        logger.info(`[Socket] Admin disconnected: ${socket.admin.name}`);
      }
    });

    socket.on('error', (err) => {
      logger.error(`[Socket] Error: ${err.message}`, { socketId: socket.id.slice(0, 6) });
    });
  });

  io.on('error', (err) => {
    logger.error(`[Socket.IO] Server error: ${err.message}`);
  });

  app.set('io', io);
  return io;
}
