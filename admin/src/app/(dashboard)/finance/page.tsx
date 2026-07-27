'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  IconLoader2, IconUsers, IconCircleCheck, IconClock, IconPlayerSkipForward, IconWavesElectricity,
} from '@tabler/icons-react';
import { useStats } from '@/lib/hooks/useAdmin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FinancePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
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
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 pl-10 lg:pl-0">
              <Button variant="ghost" size="icon" className="w-10 h-10 bg-primary hover:bg-primary/90" onClick={() => router.push('/dashboard')}>
                <IconWavesElectricity className="w-5 h-5 text-white" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-foreground">Rekap Antrian</h1>
                <p className="text-xs text-muted-foreground">Statistik hari ini</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <s.icon className={`w-4 h-4 p-0.5 rounded-full text-white ${s.color}`} />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-8">
              <CardContent className="p-6">
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
              <Card className="mt-4">
                <CardContent className="p-6">
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
          </motion.div>
        ) : null}
      </main>
    </div>
  );
}
