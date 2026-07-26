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
  createdAt: string;
  updatedAt: string;
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

export interface Queue {
  _id: string;
  merchantId: string;
  serviceId: Service;
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

export interface CreateQueueResponse {
  queue: {
    id: string;
    queueNumber: string;
    customerName: string;
    status: string;
    estimatedStartTime: string | null;
    estimatedMinutes: number;
    queuesAhead: number;
  };
  snapToken: string | null;
  orderId: string;
  paymentRequired: boolean;
  amount: number;
}

export interface LiveQueueResponse {
  current: Queue | null;
  waitingCount: number;
  waiting: Queue[];
  doneToday: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}