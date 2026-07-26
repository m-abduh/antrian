export interface Merchant {
  _id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  isActive: boolean;
  bank: {
    name: string;
    account: string;
    holder: string;
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
  status: 'waiting' | 'called' | 'serving' | 'done' | 'skipped';
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
