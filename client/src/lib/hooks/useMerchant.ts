import { useQuery } from '@tanstack/react-query';
import { merchantApi } from '../api/merchant';
import type { Merchant, Service, LiveQueueResponse } from '../types';

export function useMerchant(slug: string) {
  return useQuery<Merchant>({
    queryKey: ['merchant', slug],
    queryFn: () => merchantApi.getMerchant(slug) as Promise<Merchant>,
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useServices(slug: string) {
  return useQuery<Service[]>({
    queryKey: ['services', slug],
    queryFn: () => merchantApi.getServices(slug) as Promise<Service[]>,
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLiveQueue(slug: string, enabled = true) {
  return useQuery<LiveQueueResponse>({
    queryKey: ['liveQueue', slug],
    queryFn: () => merchantApi.getLiveQueue(slug) as Promise<LiveQueueResponse>,
    enabled: enabled && !!slug,
    refetchInterval: 5000,
    staleTime: 0,
  });
}