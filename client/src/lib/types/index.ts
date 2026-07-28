export interface SocialLink {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'whatsapp' | 'telegram' | 'x' | 'threads';
  url: string;
}

export interface Merchant {
  _id: string;
  name: string;
  slug: string;
  image: string;
  banner: string;
  address: string;
  phone: string;
  description: string;
  isActive: boolean;
  bank: {
    name: string;
    account: string;
    holder: string;
  };
  socialLinks: SocialLink[];
  customFieldsConfig?: { key: string; label: string; placeholder: string; required: boolean }[];
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
  quantity: number;
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
  isPaid: boolean;
  estimatedStartTime: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  customFieldValues?: Record<string, string>;
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
    totalPrice: number;
    services: { serviceId: string; name: string; price: number; quantity: number }[];
  };
  customerToken: string;
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
