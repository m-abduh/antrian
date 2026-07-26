import api from '../axios';
import type { Queue, Service, LoginResponse, Stats, Merchant, FinanceSummary, FinanceBalance, Disbursement } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleResponse = (r: any) => r.data;

export const adminApi = {
  login: (email: string, password: string) =>
    api.post('/admin/login', { email, password }).then(handleResponse) as Promise<LoginResponse>,

  register: (data: { name: string; email: string; password: string }) =>
    api.post('/admin/register', data).then(handleResponse) as Promise<LoginResponse>,

  getMerchant: () =>
    api.get('/admin/merchant').then(handleResponse) as Promise<Merchant>,

  updateMerchant: (data: { name?: string; address?: string; phone?: string; bank?: { name?: string; account?: string; holder?: string }; midtrans?: { serverKey?: string; clientKey?: string } }) =>
    api.put('/admin/merchant', data).then(handleResponse) as Promise<Merchant>,

  getFinanceSummary: () =>
    api.get('/admin/finance/summary').then(handleResponse) as Promise<FinanceSummary>,

  getFinanceBalance: () =>
    api.get('/admin/finance/balance').then(handleResponse) as Promise<FinanceBalance>,

  getFinanceTransactions: (params?: { page?: number; limit?: number; start?: string; end?: string }) =>
    api.get('/admin/finance/transactions', { params }).then(handleResponse) as Promise<{ transactions: Queue[]; total: number; page: number; pages: number }>,

  getFinanceDisbursements: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/finance/disbursements', { params }).then(handleResponse) as Promise<{ disbursements: Disbursement[]; total: number; page: number; pages: number }>,

  requestWithdraw: (amount: number) =>
    api.post('/admin/finance/withdraw', { amount }).then(handleResponse) as Promise<{ disbursement: Disbursement; message: string }>,

  setupMerchant: (data: { name: string; slug: string }) =>
    api.post('/admin/merchant/setup', data).then(handleResponse) as Promise<{ merchant: { _id: string; name: string; slug: string }; token?: string }>,

  getMe: () =>
    api.get('/admin/me').then(handleResponse) as Promise<LoginResponse>,

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