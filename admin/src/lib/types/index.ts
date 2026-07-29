export interface QueueService {
  serviceId: string;
  name: string;
  price: number;
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

export interface Group {
  _id: string;
  merchantId: string;
  name: string;
  serviceIds: Service[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

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
  statusConfig?: { key: string; label: string }[];
  customFieldsConfig?: { key: string; label: string; placeholder: string; required: boolean }[];
  createdAt: string;
  updatedAt: string;
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



export interface Rating {
  _id: string;
  queueNumber: string;
  customerName: string;
  customerPhone: string;
  services: { name: string }[];
  rating: number;
  comment: string;
  createdAt: string;
}
export interface Customer {
  id: string;
  customerName: string;
  customerPhone: string;
  customerToken: string;
  totalKunjungan: number;
  totalBelanja: number;
  terakhirAntri: string;
  ratingRata: number | null;
}
