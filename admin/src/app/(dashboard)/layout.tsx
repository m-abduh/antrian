'use client';

import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin-sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { IconBell, IconLoader2 } from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useNotification } from '@/lib/hooks/useNotification';
import { getAdminSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { permission, subscribe } = useNotification();
  const [notifLoading, setNotifLoading] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);

  const isDashboard = pathname === '/dashboard';
  useEffect(() => {
    if (isDashboard) setNewOrderCount(0);
  }, [isDashboard]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const socket = getAdminSocket();
    if (!socket) return;

    const handleNew = (payload: any) => {
      if (payload?.queue?.status === 'waiting') setNewOrderCount((c) => c + 1);
    };
    const handleStatus = (payload: any) => {
      if (payload?.action === 'done' || payload?.action === 'skip') {
        setNewOrderCount((c) => Math.max(0, c - 1));
      }
    };
    socket.on('queue:new', handleNew);
    socket.on('queue:status', handleStatus);
    return () => {
      socket.off('queue:new', handleNew);
      socket.off('queue:status', handleStatus);
    };
  }, [status]);

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
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}