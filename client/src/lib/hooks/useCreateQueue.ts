import { useMutation } from '@tanstack/react-query';
import { merchantApi } from '../api/merchant';
import type { CreateQueueResponse } from '../types';

export function useCreateQueue(slug: string) {
  return useMutation<CreateQueueResponse, Error, {
    serviceIds: string[];
    customerName: string;
    customerPhone: string;
    note?: string;
    customerToken?: string;
  }>({
    mutationFn: (data) => merchantApi.createQueue(slug, data),
  });
}