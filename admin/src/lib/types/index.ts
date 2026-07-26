export interface Queue {
  _id: string;
  merchantId: string;
  serviceId: {
    _id: string;
    name: string;
    duration: number;
    price: number;
  } | null;
  queueNumber: string;
  customerName: string;
  customerPhone: string;
  status: 'pending_payment' | 'waiting' | 'called' | 'serving' | 'done' | 'skipped';
  paymentStatus: 'pending' | 'paid' | 'expired';
  midtransOrderId: string;
  midtransTransactionId: string;
  paymentMethod: string;
  midtransFee: number;
  rating: number | null;
  estimatedStartTime: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface Service {
  _id: string;
  merchantId: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Merchant {
  _id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  isActive: boolean;
  midtrans: {
    serverKey: string;
    clientKey: string;
  };
  bank: {
    name: string;
    account: string;
    holder: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Disbursement {
  _id: string;
  merchantId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  referenceNo: string;
  notes: string;
  requestedAt: string;
  processedAt: string | null;
}

export interface FinanceSummary {
  totalRevenue: number;
  totalFees: number;
  netRevenue: number;
  totalDisbursed: number;
  totalDisbursementFees: number;
  pendingAmount: number;
  balance: number;
  todayRevenue: number;
  transactionCount: number;
}

export interface FinanceBalance {
  totalRevenue: number;
  totalMidtransFees: number;
  netRevenue: number;
  totalDisbursed: number;
  totalDisbursementFees: number;
  pendingAmount: number;
  balance: number;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  merchantId: string | null;
}

export interface LoginResponse {
  admin: Admin;
  token?: string;
}

export interface Stats {
  total: number;
  done: number;
  skipped: number;
  waitingNow: number;
  avgWaitTime: number;
  peakHours: { hour: string; count: number }[];
  servicesBreakdown: { name: string; count: number }[];
  date: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}