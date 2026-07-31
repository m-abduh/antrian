import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { useAdminSocket } from '@/lib/socket-provider';
import type { Queue, Service, Stats, FinanceData } from '../types';

export const queueKeys = {
  all: ['admin', 'queues'] as const,
  list: (params?: { date?: string; status?: string; excludeStatus?: string }) => ['admin', 'queues', params] as const,
};

export const serviceKeys = {
  all: ['admin', 'services'] as const,
};

export const statsKeys = {
  all: ['admin', 'stats'] as const,
  finance: ['admin', 'finance'] as const,
};

export function useQueues(params?: { date?: string; status?: string; excludeStatus?: string }) {
  const { isConnected } = useAdminSocket();
  return useQuery<Queue[]>({
    queryKey: queueKeys.list(params),
    queryFn: () => adminApi.getQueues(params),
    staleTime: 5000,
    refetchInterval: isConnected ? false : 15_000,
  });
}

export function useUpdateQueueStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, status }: { id: string; action: 'call' | 'skip' | 'done' | 'set'; status?: string }) =>
      adminApi.updateQueueStatus(id, action, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
    },
  });
}

export function useStartServing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.startServing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
    },
  });
}

export function useStats(date?: string) {
  const { isConnected } = useAdminSocket();
  const today = new Date().toISOString().split('T')[0];
  const isToday = !date || date === today;
  return useQuery<Stats>({
    queryKey: [...statsKeys.all, date],
    queryFn: () => adminApi.getStats(date),
    refetchInterval: isToday ? (isConnected ? false : 30_000) : Infinity,
  });
}

export function useFinance() {
  return useQuery<FinanceData>({
    queryKey: statsKeys.finance,
    queryFn: () => adminApi.getFinance(),
    refetchInterval: 30_000,
  });
}

export function useServices() {
  return useQuery<Service[]>({
    queryKey: serviceKeys.all,
    queryFn: () => adminApi.getServices(),
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description: string; image: string; price: number }) =>
      adminApi.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      adminApi.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}
