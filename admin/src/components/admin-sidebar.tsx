'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from '@/components/ui/sidebar';
import { IconLayoutDashboard, IconChartBar, IconSettings, IconLogout, IconLayoutKanban } from '@tabler/icons-react';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { label: 'Dashboard', icon: IconLayoutDashboard, href: '/dashboard' },
  { label: 'Layanan', icon: IconChartBar, href: '/services' },
  { label: 'Grup', icon: IconLayoutKanban, href: '/groups' },
  { label: 'Pengaturan', icon: IconSettings, href: '/settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-4 py-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-foreground">Antriin</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigasi</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between px-4 py-2">
          <p className="text-xs text-muted-foreground truncate">{session?.user?.name}</p>
          <ThemeToggle />
        </div>
        <div className="px-4 pb-2">
          <button
            onClick={() => signOut({ redirect: false }).then(() => window.location.href = '/login')}
            className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-red-500 transition-colors"
          >
            <IconLogout className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}