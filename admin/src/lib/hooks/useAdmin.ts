import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import type { Queue, Service, Stats, FinanceSummary, FinanceBalance, Disbursement } from '../types';

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
    refetchInterval: 15000,
    staleTime: 5000,
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

export function useStats(date?: string) {
  return useQuery<Stats>({
    queryKey: [...statsKeys.all, date],
    queryFn: () => adminApi.getStats(date),
    refetchInterval: date === new Date().toISOString().split('T')[0] ? 30000 : Infinity,
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

// ─── Finance ──────────────────────────────────────────────────────

export const financeKeys = {
  summary: ['admin', 'finance', 'summary'] as const,
  balance: ['admin', 'finance', 'balance'] as const,
  transactions: (params?: { page?: number; limit?: number; start?: string; end?: string }) => ['admin', 'finance', 'transactions', params] as const,
  disbursements: (params?: { page?: number; limit?: number }) => ['admin', 'finance', 'disbursements', params] as const,
};

export function useFinanceSummary() {
  return useQuery<FinanceSummary>({
    queryKey: financeKeys.summary,
    queryFn: () => adminApi.getFinanceSummary(),
  });
}

export function useFinanceBalance() {
  return useQuery<FinanceBalance>({
    queryKey: financeKeys.balance,
    queryFn: () => adminApi.getFinanceBalance(),
  });
}

export function useFinanceTransactions(params?: { page?: number; limit?: number; start?: string; end?: string }) {
  return useQuery({
    queryKey: financeKeys.transactions(params),
    queryFn: () => adminApi.getFinanceTransactions(params),
  });
}

export function useFinanceDisbursements(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: financeKeys.disbursements(params),
    queryFn: () => adminApi.getFinanceDisbursements(params),
  });
}

export function useRequestWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => adminApi.requestWithdraw(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.summary });
      queryClient.invalidateQueries({ queryKey: financeKeys.balance });
      queryClient.invalidateQueries({ queryKey: financeKeys.disbursements() });
    },
  });
}