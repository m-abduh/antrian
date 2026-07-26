import api from '../axios';
import type { Merchant, Queue, Service, CreateQueueResponse, LiveQueueResponse } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleResponse = (r: any) => r.data;

export const merchantApi = {
  getMerchant: (slug: string) =>
    api.get(`/merchant/${slug}`).then(handleResponse) as Promise<Merchant>,

  getServices: (slug: string) =>
    api.get(`/merchant/${slug}/services`).then(handleResponse) as Promise<Service[]>,

  createQueue: (slug: string, data: {
    serviceId: string;
    customerName: string;
    customerPhone: string;
  }) => api.post(`/merchant/${slug}/queue`, data).then(handleResponse) as Promise<CreateQueueResponse>,

  getLiveQueue: (slug: string) =>
    api.get(`/merchant/${slug}/queue/live`).then(handleResponse) as Promise<LiveQueueResponse>,

  getQueue: (slug: string, id: string) =>
    api.get(`/merchant/${slug}/queue/${id}`).then(handleResponse) as Promise<Queue>,
};