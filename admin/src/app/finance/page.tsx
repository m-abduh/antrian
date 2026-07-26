'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Loader2, ArrowLeft, Wallet, TrendingUp, Users, CheckCircle2,
} from 'lucide-react';
import { useStats } from '@/lib/hooks/useAdmin';

export default function FinancePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: stats, isLoading } = useStats();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Rekap Antrian</h1>
            <p className="text-xs text-gray-500">Statistik hari ini</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : stats ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Antrian', value: stats.total, color: 'bg-blue-500', icon: Users },
                { label: 'Selesai', value: stats.done, color: 'bg-green-500', icon: CheckCircle2 },
                { label: 'Menunggu', value: stats.waitingNow, color: 'bg-yellow-500', icon: TrendingUp },
                { label: 'Dilewati', value: stats.skipped, color: 'bg-red-500', icon: TrendingUp },
              ].map((stat) => (
                <div key={stat.label} className="bg-white shadow-sm rounded-2xl p-4">
                  <stat.icon className={`w-4 h-4 ${stat.color} text-white rounded-full p-0.5 mb-2`} />
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </main>
    </div>
  );
}
