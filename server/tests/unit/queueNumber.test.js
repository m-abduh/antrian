import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { generateQueueNumber, calculateEstimatedTime } from '../../src/utils/queueNumber.js';
import Merchant from '../../src/models/Merchant.js';
import Queue from '../../src/models/Queue.js';
import Service from '../../src/models/Service.js';

let mongoServer;
let merchant;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  merchant = await Merchant.create({ name: 'Test', slug: 'test' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Queue.deleteMany({});
});

describe('generateQueueNumber', () => {
  it('should return A001 for first queue of the day', async () => {
    const num = await generateQueueNumber(merchant._id);
    expect(num).toBe('A001');
  });

  it('should increment queue number', async () => {
    await Queue.create({
      merchantId: merchant._id,
      serviceId: new mongoose.Types.ObjectId(),
      queueNumber: 'A001',
      customerName: 'Test',
    });
    const num = await generateQueueNumber(merchant._id);
    expect(num).toBe('A002');
  });

  it('should reset daily', async () => {
    await Queue.create({
      merchantId: merchant._id,
      serviceId: new mongoose.Types.ObjectId(),
      queueNumber: 'A010',
      customerName: 'Test',
      createdAt: new Date(Date.now() - 86400000),
    });
    const num = await generateQueueNumber(merchant._id);
    expect(num).toBe('A001');
  });
});

describe('Service Model', () => {
  let merchant;

  beforeEach(async () => {
    merchant = await Merchant.create({ name: 'Test', slug: 'test' });
  });

  it('should create a valid service', async () => {
    const service = await Service.create({
      merchantId: merchant._id,
      name: 'Potong Rambut',
      duration: 30,
      price: 50000,
    });
    expect(service.name).toBe('Potong Rambut');
    expect(service.duration).toBe(30);
    expect(service.price).toBe(50000);
  });

  it('should reject negative price', async () => {
    await expect(Service.create({
      merchantId: merchant._id,
      name: 'Test',
      duration: 30,
      price: -1000,
    })).rejects.toThrow();
  });

  it('should reject duration less than 1', async () => {
    await expect(Service.create({
      merchantId: merchant._id,
      name: 'Test',
      duration: 0,
      price: 10000,
    })).rejects.toThrow();
  });

  it('should reject duration more than 480', async () => {
    await expect(Service.create({
      merchantId: merchant._id,
      name: 'Test',
      duration: 500,
      price: 10000,
    })).rejects.toThrow();
  });
});
