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

    const handleNew = () => setNewOrderCount((c) => c + 1);
    socket.on('queue:new', handleNew);
    return () => { socket.off('queue:new', handleNew); };
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
          <header className="border-b border-border h-14 flex items-center px-4 gap-4 bg-card sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSubscribe}
              disabled={permission === 'denied' || notifLoading}
              suppressHydrationWarning
              className="relative rounded-xl"
            >
              {notifLoading ? (
                <IconLoader2 className="w-4 h-4 animate-spin" />
              ) : (
                <IconBell className="w-4 h-4" />
              )}
              {newOrderCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center font-mono">
                  {newOrderCount}
                </span>
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