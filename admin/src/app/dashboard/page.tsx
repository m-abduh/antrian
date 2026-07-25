'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, CheckCircle2, SkipForward, LogOut, Loader2,
  Phone, Search, X, LayoutDashboard,
  Settings, BarChart3, AlertCircle, Bell,
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { useQueues, useUpdateQueueStatus, useStartServing, useStats } from '@/lib/hooks/useAdmin';
import { useNotification } from '@/lib/hooks/useNotification';
import { ErrorAlert } from '@/components/ErrorAlert';
const statusColors: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  waiting: 'bg-blue-100 text-blue-800',
  called: 'bg-green-100 text-green-800',
  serving: 'bg-purple-100 text-purple-800',
  done: 'bg-gray-100 text-gray-600',
  skipped: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending_payment: 'Menunggu Bayar',
  waiting: 'Menunggu',
  called: 'Dipanggil',
  serving: 'Dilayani',
  done: 'Selesai',
  skipped: 'Dilewati',
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionError, setActionError] = useState('');
  const updateStatus = useUpdateQueueStatus();
  const startServing = useStartServing();
  const { permission, subscribe } = useNotification();

  const handleMutation = async (fn: () => Promise<any>) => {
    setActionError('');
    try { await fn(); } catch (err: any) { setActionError(err.message || 'Gagal memperbarui status'); }
  };
  const { data: queues, isLoading } = useQueues({ status: statusFilter || undefined });
  const { data: stats } = useStats();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && !(session?.user as any)?.merchantId) {
      router.replace('/merchant/setup');
    }
  }, [status, session, router]);

  if (status !== 'authenticated' || !session?.user) return null;

  const filtered = queues?.filter((q) =>
    q.customerName.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
                <p className="text-xs text-gray-500">{session?.user?.name || 'Admin'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <Settings className="w-4 h-4" />
                Pengaturan
              </button>
              <button
                onClick={() => router.push('/services')}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Layanan
              </button>
              <button
                onClick={subscribe}
                disabled={permission === 'denied'}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-colors ${
                  permission === 'granted'
                    ? 'text-green-600 hover:bg-green-50'
                    : permission === 'denied'
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
                }`}
                title={permission === 'granted' ? 'Notifikasi aktif' : permission === 'denied' ? 'Notifikasi diblokir' : 'Aktifkan notifikasi'}
              >
                <Bell className="w-4 h-4" />
              </button>
              <button
                onClick={() => signOut({ redirect: false }).then(() => router.push('/login'))}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pb-4">
          <ErrorAlert message={actionError} onClose={() => setActionError('')} />
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats?.total ?? 0, color: 'bg-blue-500', icon: Users },
              { label: 'Selesai', value: stats?.done ?? 0, color: 'bg-green-500', icon: CheckCircle2 },
              { label: 'Menunggu', value: stats?.waitingNow ?? 0, color: 'bg-yellow-500', icon: Clock },
              { label: 'Lewat', value: stats?.skipped ?? 0, color: 'bg-red-500', icon: SkipForward },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <stat.icon className={`w-4 h-4 ${stat.color} text-white rounded-full p-0.5 mx-auto mb-1`} />
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua</option>
            <option value="pending_payment">Menunggu Bayar</option>
            <option value="waiting">Menunggu</option>
            <option value="called">Dipanggil</option>
            <option value="serving">Dilayani</option>
            <option value="done">Selesai</option>
            <option value="skipped">Dilewati</option>
          </select>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Tidak ada antrian</h3>
              <p className="text-gray-500">Belum ada antrian untuk hari ini</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filtered.map((q, i) => (
                <motion.div
                  key={q._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-white rounded-2xl shadow-sm p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-gray-900">{q.queueNumber}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 truncate">{q.customerName}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[q.status]}`}>
                          {statusLabels[q.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {q.customerPhone || '-'}
                        </span>
                        <span>{q.serviceId?.name || '-'}</span>
                        {q.paymentStatus === 'paid' && (
                          <span className="text-green-600 font-medium">Lunas</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {q.status === 'waiting' && (
                        <button
                          onClick={() => handleMutation(() => updateStatus.mutateAsync({ id: q._id, action: 'call' }))}
                          disabled={updateStatus.isPending}
                          className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {updateStatus.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Panggil
                        </button>
                      )}
                      {q.status === 'called' && (
                        <button
                          onClick={() => handleMutation(() => startServing.mutateAsync(q._id))}
                          disabled={startServing.isPending}
                          className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-xl hover:bg-purple-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {startServing.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Mulai
                        </button>
                      )}
                      {q.status === 'serving' && (
                        <button
                          onClick={() => handleMutation(() => updateStatus.mutateAsync({ id: q._id, action: 'done' }))}
                          disabled={updateStatus.isPending}
                          className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {updateStatus.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Selesai
                        </button>
                      )}
                      {(q.status === 'waiting' || q.status === 'called') && (
                        <button
                          onClick={() => handleMutation(() => updateStatus.mutateAsync({ id: q._id, action: 'skip' }))}
                          disabled={updateStatus.isPending}
                          className="px-4 py-2 bg-red-100 text-red-600 text-sm font-medium rounded-xl hover:bg-red-200 transition-colors flex items-center gap-1"
                        >
                          {updateStatus.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Lewati
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}