'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ArrowLeft, Users, CheckCircle2, Clock, SkipForward,
  Loader2, TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useStats } from '@/lib/hooks/useAdmin';

export default function StatsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { data: stats, isLoading } = useStats();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const cards = [
    { label: 'Total Antrian', value: stats?.total ?? 0, icon: Users, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: 'Selesai', value: stats?.done ?? 0, icon: CheckCircle2, color: 'bg-green-500', bg: 'bg-green-50' },
    { label: 'Dilewati', value: stats?.skipped ?? 0, icon: SkipForward, color: 'bg-red-500', bg: 'bg-red-50' },
    { label: 'Menunggu', value: stats?.waitingNow ?? 0, icon: Clock, color: 'bg-yellow-500', bg: 'bg-yellow-50' },
  ];

  const completionRate = stats && stats.total > 0
    ? Math.round((stats.done / stats.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Statistik</h1>
              <p className="text-xs text-gray-500">
                {stats?.date ? new Date(stats.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Hari ini'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
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
                  <span className="text-gray-600">Antrian waiting + called</span>
                  <span className="font-semibold text-gray-900">{stats.waitingNow}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}