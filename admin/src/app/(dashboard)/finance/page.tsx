'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  IconLoader2, IconUsers, IconCircleCheck, IconClock, IconPlayerSkipForward,
} from '@tabler/icons-react';
import { useStats } from '@/lib/hooks/useAdmin';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function FinancePage() {
  const router = useRouter();
  const { status } = useSession();
  const { data: stats, isLoading } = useStats();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') return null;

  const statCards = [
    { label: 'Total Antrian', value: stats?.total ?? 0, icon: IconUsers, color: 'bg-blue-500' },
    { label: 'Selesai', value: stats?.done ?? 0, icon: IconCircleCheck, color: 'bg-green-500' },
    { label: 'Menunggu', value: stats?.waitingNow ?? 0, icon: IconClock, color: 'bg-yellow-500' },
    { label: 'Dilewati', value: stats?.skipped ?? 0, icon: IconPlayerSkipForward, color: 'bg-red-500' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Rekap Antrian</h1>
          <p className="text-sm text-muted-foreground mt-1">Statistik hari ini</p>
        </div>

        <Separator />

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="rounded-2xl p-4">
                <CardContent className="p-0">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s) => (
                <Card key={s.label} className="rounded-2xl border border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}>
                        <s.icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="rounded-2xl">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-4">Ringkasan</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Rata-rata waktu tunggu', value: stats.avgWaitTime ? `${stats.avgWaitTime} menit` : '-' },
                      { label: 'Tanggal', value: stats.date },
                      { label: 'Peak hour', value: stats.peakHours?.length ? stats.peakHours.map((p: any) => `${p.hour} (${p.count})`).join(', ') : '-' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-medium text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {stats.servicesBreakdown?.length > 0 && (
                <Card className="rounded-2xl">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-foreground mb-4">Per Layanan</h3>
                    <div className="space-y-3">
                      {stats.servicesBreakdown.map((service: any) => (
                        <div key={service.name} className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{service.name}</span>
                          <span className="text-sm font-medium text-foreground bg-muted px-3 py-1 rounded-full">{service.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
