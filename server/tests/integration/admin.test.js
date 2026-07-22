import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

let mongoServer;
let app;
let merchant;
let admin;
let token;
let Merchant, Service, Queue, Admin, adminRoutes;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret-key-min-16-chars!!';
  process.env.MIDTRANS_SERVER_KEY = 'test-server-key';
  process.env.MIDTRANS_CLIENT_KEY = 'test-client-key';
  process.env.NODE_ENV = 'test';

  await mongoose.connect(mongoServer.getUri());

  const MerchantMod = await import('../../src/models/Merchant.js');
  const ServiceMod = await import('../../src/models/Service.js');
  const QueueMod = await import('../../src/models/Queue.js');
  const AdminMod = await import('../../src/models/Admin.js');
  const adminRoutesMod = await import('../../src/routes/admin.js');
  Merchant = MerchantMod.default;
  Service = ServiceMod.default;
  Queue = QueueMod.default;
  Admin = AdminMod.default;
  adminRoutes = adminRoutesMod.default;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

function createApp() {
  app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);
}

describe('POST /api/admin/login', () => {
  beforeEach(async () => {
    merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    admin = await Admin.create({
      merchantId: merchant._id,
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123!',
    });
    createApp();
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin@test.com', password: 'password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.admin.email).toBe('admin@test.com');
  });

  it('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ email: 'no@exist.com', password: 'password123!' });

    expect(res.status).toBe(401);
  });

  it('should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin@test.com' });

    expect(res.status).toBe(400);
  });

  it('should login case-insensitively for email', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ email: 'ADMIN@TEST.COM', password: 'password123!' });

    expect(res.status).toBe(200);
  });
});

describe('Protected Admin Routes', () => {
  beforeEach(async () => {
    merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    admin = await Admin.create({
      merchantId: merchant._id,
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123!',
    });
    token = jwt.sign(
      { id: admin._id, merchantId: merchant._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    createApp();
  });

  describe('GET /api/admin/stats', () => {
    it('should return stats for authenticated admin', async () => {
      const service = await Service.create({ merchantId: merchant._id, name: 'Test', duration: 15, price: 0 });

      await Queue.create({ merchantId: merchant._id, serviceId: service._id, queueNumber: 'A001', customerName: 'A', status: 'done', paymentStatus: 'paid' });
      await Queue.create({ merchantId: merchant._id, serviceId: service._id, queueNumber: 'A002', customerName: 'B', status: 'done', paymentStatus: 'paid' });
      await Queue.create({ merchantId: merchant._id, serviceId: service._id, queueNumber: 'A003', customerName: 'C', status: 'waiting', paymentStatus: 'paid' });

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.done).toBe(2);
      expect(res.body.data.waitingNow).toBe(1);
    });

    it('should reject without token', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });

    it('should reject with invalid token', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/admin/queues/:id/status', () => {
    it('should call next queue', async () => {
      const service = await Service.create({ merchantId: merchant._id, name: 'Test', duration: 15, price: 0 });
      const queue = await Queue.create({ merchantId: merchant._id, serviceId: service._id, queueNumber: 'A001', customerName: 'Budi', status: 'waiting', paymentStatus: 'paid' });

      const res = await request(app)
        .patch(`/api/admin/queues/${queue._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ action: 'call' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('called');
    });

    it('should skip a queue', async () => {
      const service = await Service.create({ merchantId: merchant._id, name: 'Test', duration: 15, price: 0 });
      const queue = await Queue.create({ merchantId: merchant._id, serviceId: service._id, queueNumber: 'A001', customerName: 'Budi', status: 'waiting', paymentStatus: 'paid' });

      const res = await request(app)
        .patch(`/api/admin/queues/${queue._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ action: 'skip' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('skipped');
    });

    it('should reject invalid action', async () => {
      const service = await Service.create({ merchantId: merchant._id, name: 'Test', duration: 15, price: 0 });
      const queue = await Queue.create({ merchantId: merchant._id, serviceId: service._id, queueNumber: 'A001', customerName: 'Budi', status: 'waiting', paymentStatus: 'paid' });

      const res = await request(app)
        .patch(`/api/admin/queues/${queue._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ action: 'invalid' });

      expect(res.status).toBe(400);
    });
  });

  describe('Service CRUD', () => {
    it('should create a service', async () => {
      const res = await request(app)
        .post('/api/admin/services')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Service', duration: 30, price: 75000 });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('New Service');
    });

    it('should create service without description', async () => {
      const res = await request(app)
        .post('/api/admin/services')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Minimal', duration: 15, price: 25000 });

      expect(res.status).toBe(201);
    });

    it('should list services', async () => {
      await Service.create({ merchantId: merchant._id, name: 'S1', duration: 30, price: 50000 });
      await Service.create({ merchantId: merchant._id, name: 'S2', duration: 60, price: 100000 });

      const res = await request(app)
        .get('/api/admin/services')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('should update a service', async () => {
      const service = await Service.create({ merchantId: merchant._id, name: 'Old Name', duration: 30, price: 50000 });

      const res = await request(app)
        .put(`/api/admin/services/${service._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name', price: 75000 });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('New Name');
      expect(res.body.data.price).toBe(75000);
    });

    it('should soft-delete a service', async () => {
      const service = await Service.create({ merchantId: merchant._id, name: 'To Delete', duration: 30, price: 50000 });

      const res = await request(app)
        .delete(`/api/admin/services/${service._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const deleted = await Service.findById(service._id);
      expect(deleted.isActive).toBe(false);
    });
  });
});
