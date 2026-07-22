import { describe, it, expect, beforeAll, afterAll, afterEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Admin from '../../src/models/Admin.js';
import Merchant from '../../src/models/Merchant.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  process.env.JWT_SECRET = 'test-secret-key-min-16-chars!!';
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

describe('Admin Model - Password Hashing', () => {
  it('should hash password before save', async () => {
    const merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    const admin = await Admin.create({
      merchantId: merchant._id,
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123!',
    });
    expect(admin.password).not.toBe('password123!');
    expect(admin.password).toMatch(/^\$2[ayb]\$.{56}$/);
  });

  it('should validate password correctly', async () => {
    const merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    const admin = await Admin.create({
      merchantId: merchant._id,
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123!',
    });
    const isValid = await admin.comparePassword('password123!');
    expect(isValid).toBe(true);
  });

  it('should reject wrong password', async () => {
    const merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    const admin = await Admin.create({
      merchantId: merchant._id,
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123!',
    });
    const isValid = await admin.comparePassword('wrongpassword');
    expect(isValid).toBe(false);
  });

  it('should reject password less than 8 chars', async () => {
    const merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    await expect(Admin.create({
      merchantId: merchant._id,
      name: 'Admin',
      email: 'admin@test.com',
      password: 'short',
    })).rejects.toThrow();
  });

  it('should reject invalid email format', async () => {
    const merchant = await Merchant.create({ name: 'Test', slug: 'test' });
    await expect(Admin.create({
      merchantId: merchant._id,
      name: 'Admin',
      email: 'not-an-email',
      password: 'password123!',
    })).rejects.toThrow();
  });
});

describe('JWT Token Verification', () => {
  it('should generate valid token', () => {
    const token = jwt.sign(
      { id: '123', merchantId: '456', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe('123');
    expect(decoded.merchantId).toBe('456');
    expect(decoded.role).toBe('admin');
  });

  it('should reject expired token', () => {
    const token = jwt.sign(
      { id: '123', merchantId: '456', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '0s' }
    );
    expect(() => jwt.verify(token, process.env.JWT_SECRET)).toThrow('expired');
  });

  it('should reject token with wrong secret', () => {
    const token = jwt.sign(
      { id: '123', merchantId: '456', role: 'admin' },
      'wrong-secret',
      { expiresIn: '1h' }
    );
    expect(() => jwt.verify(token, process.env.JWT_SECRET)).toThrow();
  });
});
