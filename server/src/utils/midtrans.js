import crypto from 'crypto';
import midtransClient from 'midtrans-client';
import env from '../config/env.js';

const snap = new midtransClient.Snap({
  isProduction: env.MIDTRANS_IS_PRODUCTION,
  serverKey: env.MIDTRANS_SERVER_KEY,
  clientKey: env.MIDTRANS_CLIENT_KEY,
});

export async function createTransaction(orderId, amount, customer) {
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    credit_card: {
      secure: true,
    },
    customer_details: {
      first_name: customer.name,
      phone: customer.phone || '',
    },
    enabled_payments: ['qris', 'gopay', 'shopeepay', 'bank_transfer'],
    expiry: {
      duration: 30,
      unit: 'minutes',
    },
  };

  return snap.createTransaction(parameter);
}

export function verifyNotification(reqBody) {
  const { order_id, status_code, gross_amount, signature_key, transaction_status } = reqBody;

  const serverKey = env.MIDTRANS_SERVER_KEY;
  const computedSignature = crypto
    .createHash('sha512')
    .update(order_id + status_code + gross_amount + serverKey)
    .digest('hex');

  if (computedSignature !== signature_key) {
    return { valid: false };
  }

  let paymentStatus = 'pending';
  if (transaction_status === 'settlement' || transaction_status === 'capture') {
    paymentStatus = 'paid';
  } else if (transaction_status === 'expire' || transaction_status === 'deny' || transaction_status === 'cancel') {
    paymentStatus = 'expired';
  }

  return { valid: true, paymentStatus };
}
