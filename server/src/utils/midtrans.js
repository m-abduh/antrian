import crypto from 'crypto';
import midtransClient from 'midtrans-client';
import env from '../config/env.js';

function createSnapInstance(merchant) {
  if (merchant && merchant.midtrans && merchant.midtrans.serverKey) {
    return new midtransClient.Snap({
      isProduction: env.MIDTRANS_IS_PRODUCTION,
      serverKey: merchant.midtrans.serverKey,
      clientKey: merchant.midtrans.clientKey,
    });
  }
  return new midtransClient.Snap({
    isProduction: env.MIDTRANS_IS_PRODUCTION,
    serverKey: env.MIDTRANS_SERVER_KEY,
    clientKey: env.MIDTRANS_CLIENT_KEY,
  });
}

export async function createTransaction(orderId, amount, customer, merchant) {
  const snap = createSnapInstance(merchant);

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

export function verifyNotification(reqBody, merchantServerKey) {
  const { order_id, status_code, gross_amount, signature_key, transaction_status } = reqBody;

  const serverKey = merchantServerKey || env.MIDTRANS_SERVER_KEY;
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

  const paymentType = reqBody.payment_type || '';

  return { valid: true, paymentStatus, paymentType };
}

export function calculateMidtransFee(paymentType, grossAmount) {
  const amount = typeof grossAmount === 'string' ? parseInt(grossAmount) : grossAmount;
  const VAT_RATE = 0.11;

  switch (paymentType) {
    case 'qris':
      return Math.round(amount * 0.007 * (1 + VAT_RATE));

    case 'gopay':
      return Math.round(amount * 0.02 * (1 + VAT_RATE));

    case 'shopeepay':
      return Math.round(amount * 0.02 * (1 + VAT_RATE));

    case 'dana':
      return Math.round(amount * 0.015 * (1 + VAT_RATE));

    case 'ovo':
      return Math.round(amount * 0.015 * (1 + VAT_RATE));

    case 'bank_transfer':
    case 'bca_va':
    case 'bni_va':
    case 'bri_va':
    case 'mandiri_va':
    case 'cimb_va':
    case 'danamon_va':
    case 'bsi_va':
    case 'seabank_va':
    case 'permata_va':
      return Math.round(4000 * (1 + VAT_RATE));

    case 'credit_card':
      return Math.round(amount * 0.029 + 2000);

    case 'indomaret':
    case 'alfamart':
    case 'alfamidi':
      return Math.round(5000 * (1 + VAT_RATE));

    case 'akulaku':
      return Math.round(amount * 0.017);

    case 'kredivo':
      return Math.round(amount * 0.02);

    default:
      return Math.round(amount * 0.02);
  }
}

// ─── Iris Disbursement ─────────────────────────────────────────────

function createIrisInstance() {
  const serverKey = env.MIDTRANS_IRIS_API_KEY || env.MIDTRANS_SERVER_KEY;
  return new midtransClient.Iris({
    isProduction: env.MIDTRANS_IS_PRODUCTION,
    serverKey,
  });
}

export async function createDisbursement(amount, bankName, bankAccount, bankHolder, notes) {
  const iris = createIrisInstance();
  const param = {
    payouts: [
      {
        beneficiary_name: bankHolder,
        beneficiary_account: bankAccount,
        beneficiary_bank: bankName.toLowerCase().replace(/\s+/g, '_'),
        beneficiary_email: '',
        amount: String(amount),
        notes: notes || 'Penarikan saldo Antriin',
      },
    ],
  };
  return iris.createPayouts(param);
}

export async function getDisbursementBalance() {
  const iris = createIrisInstance();
  return iris.getBalance();
}

export async function getDisbursementHistory(fromDate, toDate) {
  const iris = createIrisInstance();
  return iris.getTransactionHistory({ from_date: fromDate, to_date: toDate });
}

export async function getPayoutDetail(referenceNo) {
  const iris = createIrisInstance();
  return iris.getPayoutDetails(referenceNo);
}

export async function getBeneficiaryBanks() {
  const iris = createIrisInstance();
  return iris.getBeneficiaryBanks();
}
