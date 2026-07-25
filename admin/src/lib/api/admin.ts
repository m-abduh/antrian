import api from '../axios';
import type { Queue, Service, LoginResponse, Stats } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleResponse = (r: any) => r.data;

export const adminApi = {
  login: (email: string, password: string) =>
    api.post('/admin/login', { email, password }).then(handleResponse) as Promise<LoginResponse>,

  logout: () =>
    api.post('/admin/logout').then(handleResponse) as Promise<{ message: string }>,

  getQueues: (params?: { date?: string; status?: string }) =>
    api.get('/admin/queues', { params }).then(handleResponse) as Promise<Queue[]>,

  updateQueueStatus: (id: string, action: 'call' | 'skip' | 'done') =>
    api.patch(`/admin/queues/${id}/status`, { action }).then(handleResponse),

  startServing: (id: string) =>
    api.patch(`/admin/queues/${id}/start`).then(handleResponse),

  getStats: (date?: string) =>
    api.get('/admin/stats', { params: { date } }).then(handleResponse) as Promise<Stats>,

  subscribePush: (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    api.post('/notifications/subscribe', subscription).then(handleResponse),

  unsubscribePush: (endpoint: string) =>
    api.post('/notifications/unsubscribe', { endpoint }).then(handleResponse),

  getServices: () =>
    api.get('/admin/services').then(handleResponse) as Promise<Service[]>,

  createService: (data: { name: string; description?: string; duration: number; price: number }) =>
    api.post('/admin/services', data).then(handleResponse) as Promise<Service>,

  updateService: (id: string, data: Partial<Service>) =>
    api.put(`/admin/services/${id}`, data).then(handleResponse) as Promise<Service>,

  deleteService: (id: string) =>
    api.delete(`/admin/services/${id}`).then(handleResponse),
};