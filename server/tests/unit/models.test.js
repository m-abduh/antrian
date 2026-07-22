import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Merchant from '../../src/models/Merchant.js';
import Service from '../../src/models/Service.js';
import Queue from '../../src/models/Queue.js';
import Admin from '../../src/models/Admin.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
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

describe('Merchant Model', () => {
  it('should create a valid merchant', async () => {
    const merchant = await Merchant.create({
      name: 'Barbershop A',
      slug: 'barbershop-a',
      address: 'Jl. Merdeka No. 1',
      phone: '+6281234567890',
    });
    expect(merchant.name).toBe('Barbershop A');
    expect(merchant.slug).toBe('barbershop-a');
    expect(merchant.isActive).toBe(true);
  });

  it('should reject duplicate slug', async () => {
    await Merchant.create({ name: 'Test', slug: 'test' });
    await expect(Merchant.create({ name: 'Test 2', slug: 'test' })).rejects.toThrow();
  });

  it('should reject invalid phone format', async () => {
    await expect(Merchant.create({
      name: 'Test',
      slug: 'test',
      phone: 'abc',
    })).rejects.toThrow();
  });

  it('should lowercase slug automatically', async () => {
    const merchant = await Merchant.create({
      name: 'Test',
      slug: 'Test-Slug',
    });
    expect(merchant.slug).toBe('test-slug');
  });

  it('should set isActive default to true', async () => {
    const merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    expect(merchant.isActive).toBe(true);
  });
});
