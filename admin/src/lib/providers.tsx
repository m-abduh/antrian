'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

function AuthHydrate({ children }: { children: ReactNode }) {
  const [hydrated] = useState(() => {
    useAuthStore.getState().hydrate();
    return true;
  });

  if (!hydrated) return null;
  return <>{children}</>;
}

function AuthListener({ children }: { children: ReactNode }) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    const handler = () => {
      logout();
      router.push('/login');
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [logout, router]);

  useEffect(() => {
    if (token && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [token]);

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
      <AuthHydrate>
        <AuthListener>{children}</AuthListener>
      </AuthHydrate>
    </QueryClientProvider>
  );
}