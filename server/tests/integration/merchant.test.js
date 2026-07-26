import { describe, it, expect, beforeAll, afterAll, afterEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import request from 'supertest';

let mongoServer;
let app;
let Merchant, Service, Queue, merchantRoutes;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret-key-min-16-chars!!';
  process.env.NODE_ENV = 'test';

  await mongoose.connect(mongoServer.getUri());

  const MerchantMod = await import('../../src/models/Merchant.js');
  const ServiceMod = await import('../../src/models/Service.js');
  const QueueMod = await import('../../src/models/Queue.js');
  const merchantRoutesMod = await import('../../src/routes/merchant.js');
  Merchant = MerchantMod.default;
  Service = ServiceMod.default;
  Queue = QueueMod.default;
  merchantRoutes = merchantRoutesMod.default;
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

beforeEach(async () => {
  app = express();
  app.use(express.json());
  app.use('/api/merchant', merchantRoutes);
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

describe('GET /api/merchant/:slug', () => {
  it('should return merchant by slug', async () => {
    await Merchant.create({
      name: 'Barbershop Test',
      slug: 'barbershop-test',
      address: 'Jl. Test',
      phone: '+6281234567890',
    });

    const res = await request(app).get('/api/merchant/barbershop-test');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Barbershop Test');
  });

  it('should return 404 for non-existent slug', async () => {
    const res = await request(app).get('/api/merchant/not-found');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 for inactive merchant', async () => {
    await Merchant.create({
      name: 'Inactive',
      slug: 'inactive',
      isActive: false,
    });
    const res = await request(app).get('/api/merchant/inactive');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/merchant/:slug/services', () => {
  it('should return services for merchant', async () => {
    const merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    await Service.create({ merchantId: merchant._id, name: 'Service 1', duration: 30, price: 50000 });
    await Service.create({ merchantId: merchant._id, name: 'Service 2', duration: 60, price: 100000 });

    const res = await request(app).get('/api/merchant/test/services');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('should return only active services', async () => {
    const merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    await Service.create({ merchantId: merchant._id, name: 'Active', duration: 30, price: 50000 });
    await Service.create({ merchantId: merchant._id, name: 'Inactive', duration: 30, price: 50000, isActive: false });

    const res = await request(app).get('/api/merchant/test/services');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Active');
  });

  it('should return 404 for non-existent merchant', async () => {
    const res = await request(app).get('/api/merchant/no-such/services');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/merchant/:slug/queue', () => {
  it('should create queue for free service', async () => {
    const merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    const service = await Service.create({
      merchantId: merchant._id, name: 'Free', duration: 15, price: 0,
    });

    const res = await request(app)
      .post('/api/merchant/test/queue')
      .send({ serviceId: service._id.toString(), customerName: 'Budi' });

    expect(res.status).toBe(201);
    expect(res.body.data.queue.queueNumber).toBe('A001');
    expect(res.body.data.queue.status).toBe('waiting');
  });

  it('should create queue for paid service', async () => {
    const merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    const service = await Service.create({
      merchantId: merchant._id, name: 'Paid', duration: 30, price: 50000,
    });

    const res = await request(app)
      .post('/api/merchant/test/queue')
      .send({ serviceId: service._id.toString(), customerName: 'Budi' });

    expect(res.status).toBe(201);
    expect(res.body.data.queue.queueNumber).toBe('A001');
    expect(res.body.data.queue.status).toBe('waiting');
  });

  it('should reject empty customer name', async () => {
    const merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    const service = await Service.create({
      merchantId: merchant._id, name: 'Test', duration: 15, price: 0,
    });

    const res = await request(app)
      .post('/api/merchant/test/queue')
      .send({ serviceId: service._id.toString(), customerName: '' });

    expect(res.status).toBe(400);
  });

  it('should reject non-existent service', async () => {
    const merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post('/api/merchant/test/queue')
      .send({ serviceId: fakeId, customerName: 'Budi' });

    expect(res.status).toBe(404);
  });

  it('should reject invalid phone number', async () => {
    const merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    const service = await Service.create({
      merchantId: merchant._id, name: 'Test', duration: 15, price: 0,
    });

    const res = await request(app)
      .post('/api/merchant/test/queue')
      .send({
        serviceId: service._id.toString(),
        customerName: 'Budi',
        customerPhone: 'abc',
      });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/merchant/:slug/queue/live', () => {
  it('should return live queue status', async () => {
    const merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    const service = await Service.create({
      merchantId: merchant._id, name: 'Test', duration: 15, price: 0,
    });

    await Queue.create({
      merchantId: merchant._id,
      serviceId: service._id,
      queueNumber: 'A001',
      customerName: 'Budi',
      status: 'serving',
    });
    await Queue.create({
      merchantId: merchant._id,
      serviceId: service._id,
      queueNumber: 'A002',
      customerName: 'Ani',
      status: 'waiting',
    });
    await Queue.create({
      merchantId: merchant._id,
      serviceId: service._id,
      queueNumber: 'A003',
      customerName: 'Citra',
      status: 'waiting',
    });

    const res = await request(app).get('/api/merchant/test/queue/live');
    expect(res.status).toBe(200);
    expect(res.body.data.waitingCount).toBe(2);
  });
});
