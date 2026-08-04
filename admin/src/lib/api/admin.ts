import api from '../axios';
import type { Queue, Service, LoginResponse, Stats, FinanceData, Merchant, Group, SocialLink, Customer, Rating } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleResponse = (r: any) => r.data;

export const adminApi = {
  login: (email: string, password: string) =>
    api.post('/admin/login', { email, password }).then(handleResponse) as Promise<LoginResponse>,

  register: (data: { name: string; email: string; password: string }) =>
    api.post('/admin/register', data).then(handleResponse) as Promise<LoginResponse>,

  getMerchant: () =>
    api.get('/admin/merchant').then(handleResponse) as Promise<Merchant>,

  updateMerchant: (data: { name?: string; slug?: string; address?: string; phone?: string; description?: string; image?: string; banner?: string; bank?: { name?: string; account?: string; holder?: string }; socialLinks?: SocialLink[]; statusConfig?: { key: string; label: string }[]; customFieldsConfig?: { key: string; label: string; placeholder: string; required: boolean }[]; paymentConfirm?: boolean }) =>
    api.put('/admin/merchant', data).then(handleResponse) as Promise<Merchant>,

  setupMerchant: (data: { name: string; slug: string }) =>
    api.post('/admin/merchant/setup', data).then(handleResponse) as Promise<{ merchant: { _id: string; name: string; slug: string }; token?: string }>,

  getMe: () =>
    api.get('/admin/me').then(handleResponse) as Promise<LoginResponse>,

  logout: () =>
    api.post('/admin/logout').then(handleResponse) as Promise<{ message: string }>,

  getQueues: (params?: { date?: string; status?: string; excludeStatus?: string }) =>
    api.get('/admin/queues', { params }).then(handleResponse) as Promise<Queue[]>,

  updateQueueStatus: (id: string, action: 'call' | 'skip' | 'done' | 'set', status?: string) =>
    api.patch(`/admin/queues/${id}/status`, { action, status }).then(handleResponse),

  startServing: (id: string) =>
    api.patch(`/admin/queues/${id}/start`).then(handleResponse),

  togglePayment: (id: string) =>
    api.patch(`/admin/queues/${id}/payment`).then(handleResponse) as Promise<Queue>,

  getStats: (date?: string) =>
    api.get('/admin/stats', { params: { date } }).then(handleResponse) as Promise<Stats>,

  getFinance: () =>
    api.get('/admin/finance').then(handleResponse) as Promise<FinanceData>,

  getRatings: () =>
    api.get('/admin/ratings').then(handleResponse) as Promise<Rating[]>,

  getCustomers: (params?: { search?: string }) =>
    api.get('/admin/customers', { params }).then(handleResponse) as Promise<Customer[]>,

  subscribePush: (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    api.post('/notifications/subscribe', subscription).then(handleResponse),

  unsubscribePush: (endpoint: string) =>
    api.post('/notifications/unsubscribe', { endpoint }).then(handleResponse),

  getServices: () =>
    api.get('/admin/services').then(handleResponse) as Promise<Service[]>,

  createService: (data: { name: string; description?: string; image?: string; price: number; variants?: { name: string; price: number }[] }) =>
    api.post('/admin/services', data).then(handleResponse) as Promise<Service>,

  updateService: (id: string, data: Partial<Service>) =>
    api.put(`/admin/services/${id}`, data).then(handleResponse) as Promise<Service>,

  deleteService: (id: string) =>
    api.delete(`/admin/services/${id}`).then(handleResponse),

  getGroups: () =>
    api.get('/admin/groups').then(handleResponse) as Promise<Group[]>,

  createGroup: (data: { name: string; serviceIds?: string[] }) =>
    api.post('/admin/groups', data).then(handleResponse) as Promise<Group>,

  updateGroup: (id: string, data: { name?: string; serviceIds?: string[]; order?: number }) =>
    api.put(`/admin/groups/${id}`, data).then(handleResponse) as Promise<Group>,

  deleteGroup: (id: string) =>
    api.delete(`/admin/groups/${id}`).then(handleResponse) as Promise<{ message: string }>,

  reorderGroups: (groupIds: string[]) =>
    api.put('/admin/groups/reorder', { groupIds }).then(handleResponse) as Promise<{ message: string }>,

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(handleResponse) as Promise<{ url: string }>;
  },
};
