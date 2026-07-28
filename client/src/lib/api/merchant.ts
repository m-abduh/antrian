import api from '../axios';
import type { Merchant, Queue, Service, CreateQueueResponse, LiveQueueResponse, Group } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleResponse = (r: any) => r.data;

export const merchantApi = {
  getMerchant: (slug: string) =>
    api.get(`/merchant/${slug}`).then(handleResponse) as Promise<Merchant>,

  getServices: (slug: string) =>
    api.get(`/merchant/${slug}/services`).then(handleResponse) as Promise<Service[]>,

  getGroups: (slug: string) =>
    api.get(`/merchant/${slug}/groups`).then(handleResponse) as Promise<Group[]>,

  createQueue: (slug: string, data: {
    serviceIds: string[];
    customerName: string;
    customerPhone: string;
    note?: string;
    customerToken?: string;
    customFieldValues?: Record<string, string>;
  }) => api.post(`/merchant/${slug}/queue`, data).then(handleResponse) as Promise<CreateQueueResponse>,

  getLiveQueue: (slug: string) =>
    api.get(`/merchant/${slug}/queue/live`).then(handleResponse) as Promise<LiveQueueResponse>,

  getQueue: (slug: string, id: string) =>
    api.get(`/merchant/${slug}/queue/${id}`).then(handleResponse) as Promise<Queue>,

  getMyQueues: (slug: string, token: string) =>
    api.get(`/merchant/${slug}/queue/my`, { params: { token } }).then(handleResponse) as Promise<Queue[]>,
};