'use client';

import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin-sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { IconBell, IconLoader2 } from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '@/lib/hooks/useNotification';
import { useAdminSocket } from '@/lib/socket-provider';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { queueKeys, statsKeys } from '@/lib/hooks/useAdmin';
import type { Queue } from '@/lib/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { permission, subscribe } = useNotification();
  const [notifLoading, setNotifLoading] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);

  const { socket: adminSocket, kicked } = useAdminSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const cached = queryClient.getQueriesData<Queue[]>({ queryKey: queueKeys.all });
    for (const [, data] of cached) {
      if (data) {
        setNewOrderCount(data.filter(q => q.status !== 'done' && q.status !== 'skipped').length);
        break;
      }
    }

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        Array.isArray(event.query.queryKey) &&
        event.query.queryKey[0] === 'admin' &&
        event.query.queryKey[1] === 'queues'
      ) {
        const data = event.query.state.data as Queue[] | undefined;
        if (data) {
          setNewOrderCount(data.filter(q => q.status !== 'done' && q.status !== 'skipped').length);
        }
      }
    });
    return unsubscribe;
  }, [queryClient]);

  useEffect(() => {
    if (!adminSocket) return;

    const handleNew = (payload: any) => {
      if (payload?.queue) {
        queryClient.setQueriesData<Queue[]>({ queryKey: queueKeys.all }, (old) => {
          if (!old) return old;
          if (old.some(q => q._id === payload.queue._id)) return old;
          return [payload.queue, ...old];
        });
      }
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
    };

    const handleStatus = (payload: any) => {
      if (payload?.queue) {
        queryClient.setQueriesData<Queue[]>({ queryKey: queueKeys.all }, (old) => {
          if (!old) return old;
          return old.map(q => q._id === payload.queue._id ? { ...q, ...payload.queue } : q);
        });
        queryClient.invalidateQueries({ queryKey: statsKeys.all });
      }
    };

    adminSocket.on('queue:new', handleNew);
    adminSocket.on('queue:status', handleStatus);
    return () => {
      adminSocket.off('queue:new', handleNew);
      adminSocket.off('queue:status', handleStatus);
    };
  }, [adminSocket, queryClient]);

  const handleSubscribe = useCallback(async () => {
    setNotifLoading(true);
    await subscribe();
    setNotifLoading(false);
  }, [subscribe]);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <header className={`border-b h-14 flex items-center px-4 gap-4 sticky top-0 z-10 transition-colors ${newOrderCount > 0 ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800' : 'bg-card border-border'}`}>
            <SidebarTrigger />
            <div className="flex-1" />
            <Button
              variant="ghost"
              onClick={handleSubscribe}
              disabled={permission === 'denied' || notifLoading}
              suppressHydrationWarning
              className="relative rounded-xl gap-2"
            >
              {notifLoading ? (
                <IconLoader2 className="w-4 h-4 animate-spin" />
              ) : (
                <IconBell className="w-4 h-4" />
              )}
              {newOrderCount > 0 ? (
                  <span className="text-xs font-medium">
                  {newOrderCount} pesanan baru
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Notifikasi</span>
              )}
            </Button>
          </header>
          {kicked && (
            <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
              <span className="text-sm text-amber-800 dark:text-amber-200 flex-1">
                Sesi ini ditutup karena ada login dari tab/perangkat lain
              </span>
              <button
                onClick={() => location.reload()}
                className="text-xs font-medium text-amber-800 dark:text-amber-200 underline hover:no-underline"
              >
                Muat ulang
              </button>
            </div>
          )}
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}