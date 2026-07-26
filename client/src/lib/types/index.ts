export interface Merchant {
  _id: string;
  name: string;
  slug: string;
  image: string;
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
  image: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QueueService {
  serviceId: string;
  name: string;
  price: number;
}

export interface Group {
  _id: string;
  merchantId: string;
  name: string;
  serviceIds: Service[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Queue {
  _id: string;
  merchantId: string;
  services: QueueService[];
  note: string;
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
