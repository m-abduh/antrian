import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Merchant from '../src/models/Merchant.js';
import Service from '../src/models/Service.js';
import Admin from '../src/models/Admin.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret-key-min-16-chars!!';
  process.env.MIDTRANS_SERVER_KEY = 'test-server-key';
  process.env.MIDTRANS_CLIENT_KEY = 'test-client-key';
  process.env.NODE_ENV = 'test';

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

export async function createTestMerchant(overrides = {}) {
  return Merchant.create({
    name: 'Test Merchant',
    slug: 'test-merchant',
    address: 'Jl. Test No. 1',
    phone: '+6281234567890',
    isActive: true,
    ...overrides,
  });
}

export async function createTestService(merchantId, overrides = {}) {
  return Service.create({
    merchantId,
    name: 'Potong Rambut',
    description: 'Potong rambut standar',
    duration: 30,
    price: 50000,
    isActive: true,
    ...overrides,
  });
}

export async function createTestAdmin(merchantId, overrides = {}) {
  const password = overrides.password || 'password123!';
  const hashedPassword = await bcrypt.hash(password, 4);
  return Admin.create({
    merchantId,
    name: 'Admin Test',
    email: 'admin@test.com',
    password: hashedPassword,
    role: 'admin',
    ...overrides,
    password: hashedPassword,
  });
}

export function generateToken(adminId, merchantId, role = 'admin') {
  return jwt.sign(
    { id: adminId, merchantId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export function getApp() {
  const app = (await import('../src/index.js')).default;
  return app;
}
