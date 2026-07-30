'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  IconLoader2, IconUsers, IconCircleCheck, IconClock, IconPlayerSkipForward,
  IconCoin, IconShoppingCart, IconReceipt, IconTrendingUp, IconStar,
  IconUserPlus, IconUserCheck, IconHourglass,
} from '@tabler/icons-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
  CartesianGrid,
} from 'recharts';
import { useFinance } from '@/lib/hooks/useAdmin';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

export default function FinancePage() {
  const router = useRouter();
  const { status } = useSession();
  const { data: finance, isLoading } = useFinance();
  const [chartMode, setChartMode] = useState<'revenue' | 'orders' | 'customers'>('revenue');

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') return null;

  const t = finance?.today;

  const todayCards = [
    { label: 'Pemasukan', value: t ? formatRp(t.totalRevenue) : '-', icon: IconCoin, color: 'bg-emerald-500' },
    { label: 'Antrian', value: t?.totalOrders ?? '-', icon: IconUsers, color: 'bg-blue-500' },
    { label: 'Rata-rata Belanja', value: t ? formatRp(t.avgOrderValue) : '-', icon: IconShoppingCart, color: 'bg-violet-500' },
    { label: 'Sudah Bayar', value: t ? `${t.paidCount} (${formatRp(t.paidRevenue)})` : '-', icon: IconReceipt, color: 'bg-green-500' },
    { label: 'Belum Bayar', value: t ? `${t.unpaidCount} (${formatRp(t.unpaidRevenue)})` : '-', icon: IconCoin, color: 'bg-orange-500' },
  ];

  const opsCards = [
    { label: 'Selesai', value: t?.completedCount ?? '-', icon: IconCircleCheck, color: 'bg-green-500' },
    { label: 'Menunggu', value: t?.waitingNow ?? '-', icon: IconClock, color: 'bg-yellow-500' },
    { label: 'Dilewati', value: t?.skippedCount ?? '-', icon: IconPlayerSkipForward, color: 'bg-red-500' },
    { label: 'Pelanggan', value: t ? `${t.uniqueCustomerCount} (${t.newCustomers} baru)` : '-', icon: IconUsers, color: 'bg-cyan-500' },
    { label: 'Rating', value: t ? `${t.avgRating} ⭐ (${t.totalRatings})` : '-', icon: IconStar, color: 'bg-amber-500' },
  ];

  const detailCards = [
    { label: 'Waktu Tunggu', value: t ? `${t.avgWaitTime} mnt` : '-', icon: IconHourglass, color: 'bg-indigo-500' },
    { label: 'Waktu Layanan', value: t ? `${t.avgServiceTime} mnt` : '-', icon: IconClock, color: 'bg-purple-500' },
    { label: 'Pelanggan Baru', value: t?.newCustomers ?? '-', icon: IconUserPlus, color: 'bg-teal-500' },
    { label: 'Pelanggan Kembali', value: t?.returningCustomers ?? '-', icon: IconUserCheck, color: 'bg-sky-500' },
    { label: 'Total Hari Ini', value: t ? formatRp(t.totalRevenue) : '-', icon: IconTrendingUp, color: 'bg-rose-500' },
  ];

  const skeletonCards = (count: number) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="rounded-xl">
          <CardContent className="p-4">
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-6 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 space-y-6">
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Separator />
          {skeletonCards(5)}
          {skeletonCards(5)}
          {skeletonCards(5)}
        </div>
      </div>
    );
  }

  if (!finance) return null;

  const dailyData = finance.dailyTrend.map((d) => ({
    ...d,
    date: new Date(d.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
  }));

  const serviceData = finance.servicesBreakdown.slice(0, 8);

  const peakData = finance.peakHours;

  const formatTooltip = (value: number) => formatRp(value);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Laporan Keuangan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ringkasan pemasukan dan aktivitas hari ini</p>
        </div>

        <Separator />

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Row 1: Keuangan */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-emerald-500" />
              Ringkasan Keuangan
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {todayCards.map((s) => (
                <Card key={s.label} className="rounded-xl border border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <div className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center`}>
                        <s.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <p className="text-sm md:text-base font-bold text-foreground truncate">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Row 2: Operasional */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-blue-500" />
              Ringkasan Operasional
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {opsCards.map((s) => (
                <Card key={s.label} className="rounded-xl border border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <div className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center`}>
                        <s.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <p className="text-sm md:text-base font-bold text-foreground truncate">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Row 3: Detail */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-violet-500" />
              Detail Layanan
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {detailCards.map((s) => (
                <Card key={s.label} className="rounded-xl border border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <div className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center`}>
                        <s.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <p className="text-sm md:text-base font-bold text-foreground truncate">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Trend 30 Hari */}
            <Card className="rounded-xl border border-border/60 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground text-sm">Tren 30 Hari</h3>
                  <div className="flex gap-1">
                    {(['revenue', 'orders', 'customers'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setChartMode(mode)}
                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                          chartMode === mode
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {mode === 'revenue' ? 'Revenue' : mode === 'orders' ? 'Antrian' : 'Pelanggan'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <Tooltip
                        formatter={(value: number) =>
                          chartMode === 'revenue' ? formatRp(value) : value
                        }
                        contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
                      />
                      {chartMode === 'revenue' && (
                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                      )}
                      {chartMode === 'orders' && (
                        <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      )}
                      {chartMode === 'customers' && (
                        <Line type="monotone" dataKey="customers" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Layanan Terlaris */}
            <Card className="rounded-xl border border-border/60 shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground text-sm mb-4">Layanan Terlaris</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceData} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => formatRp(v)} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" width={75} />
                      <Tooltip formatter={(value: number) => formatRp(value)} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }} />
                      <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                        {serviceData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Jam Sibuk */}
            <Card className="rounded-xl border border-border/60 shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground text-sm mb-4">Jam Sibuk</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="hour" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Pembayaran */}
            <Card className="rounded-xl border border-border/60 shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground text-sm mb-2">Status Pembayaran</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Lunas', value: t?.paidCount ?? 0 },
                          { name: 'Belum Bayar', value: t?.unpaidCount ?? 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Detail Per Layanan */}
            <Card className="rounded-xl border border-border/60 shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground text-sm mb-4">Detail Per Layanan</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-3 text-muted-foreground font-medium text-xs">Layanan</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Pesanan</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Qty</th>
                        <th className="text-right py-2 pl-3 text-muted-foreground font-medium text-xs">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finance.servicesBreakdown.map((s) => (
                        <tr key={s.name} className="border-b border-border/50 last:border-0">
                          <td className="py-2.5 pr-3 text-foreground font-medium truncate max-w-[140px]">{s.name}</td>
                          <td className="text-right py-2.5 px-3 text-foreground">{s.orders}</td>
                          <td className="text-right py-2.5 px-3 text-foreground">{s.quantity}</td>
                          <td className="text-right py-2.5 pl-3 text-foreground font-medium">{formatRp(s.revenue)}</td>
                        </tr>
                      ))}
                      {finance.servicesBreakdown.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-muted-foreground text-xs">Belum ada data</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pelanggan Teratas */}
            <Card className="rounded-xl border border-border/60 shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground text-sm mb-4">Pelanggan Teratas (30 hari)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-3 text-muted-foreground font-medium text-xs">Pelanggan</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Antri</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Total</th>
                        <th className="text-right py-2 pl-3 text-muted-foreground font-medium text-xs">Terakhir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finance.topCustomers.map((c) => (
                        <tr key={c.customerName + c.customerPhone} className="border-b border-border/50 last:border-0">
                          <td className="py-2.5 pr-3 text-foreground font-medium truncate max-w-[140px]">{c.customerName}</td>
                          <td className="text-right py-2.5 px-3 text-foreground">{c.totalOrders}x</td>
                          <td className="text-right py-2.5 px-3 text-foreground font-medium">{formatRp(c.totalSpent)}</td>
                          <td className="text-right py-2.5 pl-3 text-muted-foreground text-xs">
                            {new Date(c.lastVisit).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </td>
                        </tr>
                      ))}
                      {finance.topCustomers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-muted-foreground text-xs">Belum ada data</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
