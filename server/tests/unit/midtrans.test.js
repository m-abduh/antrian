import { describe, it, expect, beforeAll } from '@jest/globals';
import crypto from 'crypto';

let verifyNotification;

beforeAll(async () => {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  process.env.MIDTRANS_SERVER_KEY = 'test-server-key';
  process.env.MIDTRANS_CLIENT_KEY = 'test-client-key';
  process.env.JWT_SECRET = 'test-secret-key-min-16-chars!!';
  process.env.NODE_ENV = 'test';
  const midtrans = await import('../../src/utils/midtrans.js');
  verifyNotification = midtrans.verifyNotification;
});

describe('verifyNotification', () => {
  it('should return valid for correct signature', () => {
    const orderId = 'ORDER-123';
    const statusCode = '200';
    const grossAmount = '50000.00';
    const serverKey = 'test-server-key';

    const signature = crypto
      .createHash('sha512')
      .update(orderId + statusCode + grossAmount + serverKey)
      .digest('hex');

    const result = verifyNotification({
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signature,
      transaction_status: 'settlement',
    });

    expect(result.valid).toBe(true);
    expect(result.paymentStatus).toBe('paid');
  });

  it('should reject invalid signature', () => {
    const result = verifyNotification({
      order_id: 'ORDER-123',
      status_code: '200',
      gross_amount: '50000',
      signature_key: 'invalid-signature',
      transaction_status: 'settlement',
    });
    expect(result.valid).toBe(false);
  });

  it('should detect expired payment', () => {
    const orderId = 'ORDER-123';
    const statusCode = '200';
    const grossAmount = '50000';
    const serverKey = 'test-server-key';
    const signature = crypto
      .createHash('sha512')
      .update(orderId + statusCode + grossAmount + serverKey)
      .digest('hex');

    const result = verifyNotification({
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signature,
      transaction_status: 'expire',
    });
    expect(result.valid).toBe(true);
    expect(result.paymentStatus).toBe('expired');
  });
});
