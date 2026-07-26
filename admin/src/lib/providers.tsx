'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setAccessToken } from '@/lib/auth-token';

function TokenSync({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    setAccessToken((session as any)?.accessToken ?? null);
  }, [session]);

  return <>{children}</>;
}

function AuthListener({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const handler = () => {
      import('next-auth/react').then(({ signOut }) => {
        signOut({ redirect: false });
      });
      router.push('/login');
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [router]);

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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <TokenSync>
            <AuthListener>{children}</AuthListener>
          </TokenSync>
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
