'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ArrowLeft, Users, CheckCircle2, Clock, SkipForward,
  Loader2, TrendingUp, Calendar, Clock8,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useStats } from '@/lib/hooks/useAdmin';
import { ErrorAlert } from '@/components/ErrorAlert';

export default function StatsPage() {
  const router = useRouter();
  const { status } = useSession();
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const { data: stats, isLoading, error } = useStats(selectedDate);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') return null;

  const cards = [
    { label: 'Total Antrian', value: stats?.total ?? 0, icon: Users, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: 'Selesai', value: stats?.done ?? 0, icon: CheckCircle2, color: 'bg-green-500', bg: 'bg-green-50' },
    { label: 'Dilewati', value: stats?.skipped ?? 0, icon: SkipForward, color: 'bg-red-500', bg: 'bg-red-50' },
    { label: 'Menunggu', value: stats?.waitingNow ?? 0, icon: Clock, color: 'bg-yellow-500', bg: 'bg-yellow-50' },
  ];

  const completionRate = stats && stats.total > 0
    ? Math.round((stats.done / stats.total) * 100)
    : 0;

  const peakColor = (count: number, max: number) => {
    if (max === 0) return 'bg-blue-200';
    const ratio = count / max;
    if (ratio > 0.7) return 'bg-blue-600';
    if (ratio > 0.4) return 'bg-blue-400';
    return 'bg-blue-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Statistik</h1>
              <p className="text-xs text-gray-500">
                {stats?.date ? new Date(stats.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Hari ini'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={today}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {error && <div className="mb-4"><ErrorAlert message={error.message || 'Gagal memuat statistik'} /></div>}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !stats ? (
          <div className="text-center py-20">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum ada data</h3>
            <p className="text-gray-500">Data statistik akan muncul setelah ada antrian</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {cards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`${card.bg} rounded-2xl p-6`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      <p className="text-sm text-gray-600">{card.label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Ringkasan
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Tingkat Penyelesaian</span>
                    <span className="font-semibold text-gray-900">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionRate}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="bg-green-500 h-2 rounded-full"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Rata-rata waktu tunggu</span>
                  <span className="font-semibold text-gray-900">{stats.avgWaitTime} menit</span>
                </div>
              </div>
            </div>

            {stats.peakHours.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock8 className="w-5 h-5 text-blue-500" />
                  Jam Tersibuk
                </h3>
                <div className="space-y-2">
                  {stats.peakHours.map((ph) => {
                    const maxCount = Math.max(...stats.peakHours.map(p => p.count));
                    return (
                      <div key={ph.hour} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-12">{ph.hour}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(ph.count / maxCount) * 100}%` }}
                            transition={{ duration: 0.6 }}
                            className={`h-full rounded-full ${peakColor(ph.count, maxCount)}`}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-8 text-right">{ph.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {stats.servicesBreakdown.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Per Layanan
                </h3>
                <div className="space-y-3">
                  {stats.servicesBreakdown.map((svc) => (
                    <div key={svc.name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{svc.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(svc.count / Math.max(...stats.servicesBreakdown.map(s => s.count))) * 100}%` }}
                            transition={{ duration: 0.6 }}
                            className="bg-blue-500 h-2 rounded-full"
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-6 text-right">{svc.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}