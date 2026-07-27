'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from '@/components/ui/sidebar';
import {
  IconLayoutDashboard, IconChartBar, IconSettings, IconLogout,
  IconLayoutKanban, IconReportAnalytics, IconWavesElectricity,
} from '@tabler/icons-react';
import { adminApi } from '@/lib/api/admin';
import { imageUrl } from '@/lib/imageUrl';
import type { Merchant } from '@/lib/types';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { label: 'Dashboard', icon: IconLayoutDashboard, href: '/dashboard' },
  { label: 'Layanan', icon: IconChartBar, href: '/services' },
  { label: 'Kategori', icon: IconLayoutKanban, href: '/groups' },
  { label: 'Laporan', icon: IconReportAnalytics, href: '/finance' },
  { label: 'Pengaturan', icon: IconSettings, href: '/settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    if (session?.user) {
      adminApi.getMerchant().then(setMerchant).catch(() => {});
    }
  }, [session]);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-5">
          {merchant?.image ? (
            <img src={imageUrl(merchant.image)} alt={merchant.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0 shadow-sm" />
          ) : (
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-sm">
              <IconWavesElectricity className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <span className="font-bold text-foreground text-base block truncate">{merchant?.name || 'Tunggu.id'}</span>
            <p className="text-[10px] text-muted-foreground leading-tight truncate">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive} size="lg" tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="border-t border-border mx-4" />
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
              {session?.user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <p className="text-sm font-medium text-foreground truncate">{session?.user?.name || 'Admin'}</p>
          </div>
          <ThemeToggle />
        </div>
        <button
          onClick={() => signOut({ redirect: false }).then(() => window.location.href = '/login')}
          className="mx-4 mb-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl py-2 transition-colors"
        >
          <IconLogout className="w-4 h-4" />
          Keluar
        </button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
