import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import type { Queue, Service, Stats } from '../types';

export const queueKeys = {
  all: ['admin', 'queues'] as const,
  list: (params?: { date?: string; status?: string }) => ['admin', 'queues', params] as const,
};

export const serviceKeys = {
  all: ['admin', 'services'] as const,
};

export const statsKeys = {
  all: ['admin', 'stats'] as const,
};

export function useQueues(params?: { date?: string; status?: string }) {
  return useQuery<Queue[]>({
    queryKey: queueKeys.list(params),
    queryFn: () => adminApi.getQueues(params),
    refetchInterval: 5000,
    staleTime: 0,
  });
}

export function useUpdateQueueStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'call' | 'skip' | 'done' }) =>
      adminApi.updateQueueStatus(id, action),
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

export function useStats() {
  return useQuery<Stats>({
    queryKey: statsKeys.all,
    queryFn: () => adminApi.getStats(),
    refetchInterval: 10000,
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
    mutationFn: (data: { name: string; description: string; duration: number; price: number }) =>
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