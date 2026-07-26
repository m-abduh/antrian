'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, CheckCircle2, SkipForward, Loader2,
  Phone, Search, X, AlertCircle, Bell, BarChart3,
} from 'lucide-react';
import { useQueues, useUpdateQueueStatus, useStartServing, useStats, queueKeys, statsKeys } from '@/lib/hooks/useAdmin';
import { useNotification } from '@/lib/hooks/useNotification';
import { ErrorAlert } from '@/components/ErrorAlert';
import { getAdminSocket, disconnectAdminSocket } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  waiting: { label: 'Menunggu', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400', dot: 'bg-blue-500' },
  called: { label: 'Dipanggil', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400', dot: 'bg-green-500' },
  serving: { label: 'Dilayani', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400', dot: 'bg-purple-500' },
  done: { label: 'Selesai', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-400' },
  skipped: { label: 'Dilewati', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400', dot: 'bg-red-500' },
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
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
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && !(session?.user as any)?.merchantId) {
      router.replace('/merchant/setup');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const socket = getAdminSocket();
    if (!socket) return;

    const handleQueueEvent = () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
    };

    socket.on('queue:new', handleQueueEvent);
    socket.on('queue:status', handleQueueEvent);

    return () => {
      socket.off('queue:new', handleQueueEvent);
      socket.off('queue:status', handleQueueEvent);
      disconnectAdminSocket();
    };
  }, [queryClient, status]);

  if (status !== 'authenticated' || !session?.user) return null;

  const filtered = queues?.filter((q) =>
    q.customerName.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const statCards = [
    { label: 'Total Hari Ini', value: stats?.total ?? 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Selesai', value: stats?.done ?? 0, icon: CheckCircle2, color: 'bg-green-500' },
    { label: 'Menunggu', value: stats?.waitingNow ?? 0, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Dilewati', value: stats?.skipped ?? 0, icon: SkipForward, color: 'bg-red-500' },
  ];

  return (
    <>
      <header className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 lg:pt-4" style={{ paddingLeft: 'calc(1rem + 2.75rem)' }}>
          <div className="sm:px-0 lg:px-0 ml-10 sm:ml-0 lg:ml-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">{session?.user?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/finance')}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  Statistik
                </button>
                <button
                  onClick={subscribe}
                  disabled={permission === 'denied'}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-colors ${
                    permission === 'granted'
                      ? 'text-green-600 dark:text-green-400 hover:bg-green-500/10'
                      : permission === 'denied'
                      ? 'text-muted-foreground cursor-not-allowed'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title={permission === 'granted' ? 'Notifikasi aktif' : 'Aktifkan notifikasi'}
                >
                  <Bell className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-4 space-y-4">
          <ErrorAlert message={actionError} onClose={() => setActionError('')} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statCards.map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <s.icon className={`w-4 h-4 p-0.5 rounded-full text-white ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="">Semua</option>
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Tidak ada antrian</h3>
              <p className="text-muted-foreground">Belum ada antrian untuk hari ini</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filtered.map((q, i) => (
                <motion.div
                  key={q._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-card border border-border rounded-2xl p-4 sm:p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-foreground">{q.queueNumber}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground truncate">{q.customerName}</h4>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusConfig[q.status]?.color}`}>
                          {statusConfig[q.status]?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {q.customerPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {q.customerPhone}
                          </span>
                        )}
                          <span>{q.services?.map((s: any) => s.name).join(', ') || '-'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {q.status === 'waiting' && (
                        <button
                          onClick={() => handleMutation(() => updateStatus.mutateAsync({ id: q._id, action: 'call' }))}
                          disabled={updateStatus.isPending}
                          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl disabled:opacity-50 hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          {updateStatus.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Panggil
                        </button>
                      )}
                      {q.status === 'called' && (
                        <button
                          onClick={() => handleMutation(() => startServing.mutateAsync(q._id))}
                          disabled={startServing.isPending}
                          className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-xl disabled:opacity-50 hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          {startServing.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Mulai
                        </button>
                      )}
                      {q.status === 'serving' && (
                        <button
                          onClick={() => handleMutation(() => updateStatus.mutateAsync({ id: q._id, action: 'done' }))}
                          disabled={updateStatus.isPending}
                          className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-xl disabled:opacity-50 hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          {updateStatus.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          Selesai
                        </button>
                      )}
                      {(q.status === 'waiting' || q.status === 'called') && (
                        <button
                          onClick={() => handleMutation(() => updateStatus.mutateAsync({ id: q._id, action: 'skip' }))}
                          disabled={updateStatus.isPending}
                          className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-1.5"
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
    </>
  );
}
