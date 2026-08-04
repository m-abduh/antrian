import { useMutation } from '@tanstack/react-query';
import { merchantApi } from '../api/merchant';
import type { CreateQueueResponse } from '../types';

export function useCreateQueue(slug: string) {
  return useMutation<CreateQueueResponse, Error, {
    serviceIds?: string[];
    items?: { serviceId: string; variant?: string; quantity?: number }[];
    customerName: string;
    customerPhone: string;
    note?: string;
    customerToken?: string;
    customFieldValues?: Record<string, string>;
  }>({
    mutationFn: (data) => merchantApi.createQueue(slug, data),
  });
}