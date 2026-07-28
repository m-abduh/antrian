import { useQuery } from '@tanstack/react-query';
import { merchantApi } from '../api/merchant';
import type { Queue } from '../types';

export function useMyQueues(slug: string, token: string | null) {
  return useQuery<Queue[]>({
    queryKey: ['myQueues', slug, token],
    queryFn: () => merchantApi.getMyQueues(slug, token!) as Promise<Queue[]>,
    enabled: !!slug && !!token,
    refetchInterval: 10_000,
  });
}
