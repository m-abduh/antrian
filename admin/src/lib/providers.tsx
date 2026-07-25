'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';

function AuthHydrate({ children }: { children: ReactNode }) {
  const [hydrated] = useState(() => {
    useAuthStore.getState().hydrate();
    return true;
  });

  if (!hydrated) return null;
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrate>{children}</AuthHydrate>
    </QueryClientProvider>
  );
}