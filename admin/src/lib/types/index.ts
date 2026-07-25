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

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  merchantId: string;
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