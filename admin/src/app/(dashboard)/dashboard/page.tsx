'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconUsers, IconClock, IconCircleCheck, IconPlayerSkipForward, IconLoader2,
  IconBrandWhatsapp, IconSearch, IconX, IconAlertCircle, IconChartBar, IconCreditCard,
} from '@tabler/icons-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { useQueues, useUpdateQueueStatus, useStartServing, useStats, queueKeys, statsKeys } from '@/lib/hooks/useAdmin';
import { adminApi } from '@/lib/api/admin';
import type { Queue } from '@/lib/types';
import { ErrorAlert } from '@/components/ErrorAlert';
import { useAdminSocket } from '@/lib/socket-provider';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const STATUS_VARIANTS: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; cls: string }> = {
  waiting: { variant: 'secondary', cls: '' },
  called: { variant: 'default', cls: 'bg-blue-500 text-white dark:bg-blue-600' },
  serving: { variant: 'default', cls: 'bg-purple-500 text-white dark:bg-purple-600' },
  done: { variant: 'secondary', cls: 'bg-green-500 text-white dark:bg-green-600' },
  skipped: { variant: 'destructive', cls: '' },
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <Card className="border border-border rounded-2xl overflow-hidden">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const DEFAULT_LABELS: Record<string, string> = {
  waiting: 'Menunggu', called: 'Dipanggil', serving: 'Dilayani',
  done: 'Selesai', skipped: 'Dilewati',
};

function QueueActions({
  queue, activeStatuses, statusLabels, specialStatuses,
  updateStatus, startServing, handleMutation, togglePayment,
  confirmStatuses, onConfirmAction, paymentConfirm, onConfirmPayment,
}: {
  queue: Queue; activeStatuses: string[]; statusLabels: Record<string, string>; specialStatuses: { key: string; label: string }[];
  updateStatus: { isPending: boolean; mutateAsync: (args: any) => Promise<any> };
  startServing: { isPending: boolean; mutateAsync: (id: string) => Promise<any> };
  handleMutation: (fn: () => Promise<any>) => Promise<void>;
  togglePayment: { isPending: boolean; mutate: (id: string) => void };
  confirmStatuses: Set<string>;
  onConfirmAction: (q: Queue, status: string, label: string) => void;
  paymentConfirm: boolean;
  onConfirmPayment: (q: Queue, isPay: boolean) => void;
}) {
  const currentIdx = activeStatuses.indexOf(queue.status);
  if (currentIdx === -1) return null;

  const isLastBeforeDone = currentIdx === activeStatuses.length - 2;
  const nextStatus = activeStatuses[currentIdx + 1];
  const nextLabel = nextStatus ? (statusLabels[nextStatus] || nextStatus) : '';
  const isPending = updateStatus.isPending || startServing.isPending;
  const showPayment = queue.status !== 'waiting' && queue.status !== 'skipped';

  const advance = () => {
    if (nextStatus) {
      if (confirmStatuses.has(nextStatus)) {
        onConfirmAction(queue, nextStatus, nextLabel);
      } else {
        handleMutation(() => updateStatus.mutateAsync({ id: queue._id, action: 'set', status: nextStatus }));
      }
    }
  };

  const isTerminal = queue.status === 'done' || queue.status === 'skipped';

  return (
    <>
      {!isTerminal && nextStatus && (
        <Button
          variant={isLastBeforeDone ? 'default' : 'default'}
          size="sm"
          onClick={advance}
          disabled={isPending}
          className={`rounded-xl shadow-sm ${
            isLastBeforeDone ? 'bg-green-500 hover:bg-green-600 text-white' : ''
          }`}
        >
          {isPending && <IconLoader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
          {nextLabel}
        </Button>
      )}
      {specialStatuses.map((s) => {
        if (queue.status === s.key) return null;
        if (queue.status === 'done' || queue.status === 'skipped') return null;
        if (s.key === 'skipped' && queue.status !== 'waiting') return null;
        return (
          <Button
            key={s.key}
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirmStatuses.has(s.key)) {
                onConfirmAction(queue, s.key, s.label);
              } else {
                handleMutation(() => updateStatus.mutateAsync({ id: queue._id, action: 'set', status: s.key }));
              }
            }}
            disabled={isPending}
            className={`rounded-xl ${
              s.key === 'skipped' || s.key === 'cancelled'
                ? 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-500/10'
                : 'text-muted-foreground'
            }`}
          >
            {isPending && <IconLoader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            {s.label}
          </Button>
        );
      })}
      {showPayment && (
        <button
          onClick={() => paymentConfirm ? onConfirmPayment(queue, !queue.isPaid) : togglePayment.mutate(queue._id)}
          disabled={togglePayment.isPending}
          className={`h-9 rounded-xl flex items-center gap-1.5 px-3 flex-shrink-0 transition-all text-xs font-medium ${
            queue.isPaid
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
          }`}
          title={queue.isPaid ? 'Sudah Dibayar' : 'Tandai Sudah Bayar'}
        >
          {togglePayment.isPending ? (
            <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <IconCreditCard className="w-3.5 h-3.5" />
          )}
          {queue.isPaid ? 'Lunas' : 'Bayar'}
        </button>
      )}
    </>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionError, setActionError] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ queue: Queue; status: string; label: string } | null>(null);
  const [confirmPayment, setConfirmPayment] = useState<{ queue: Queue; isPay: boolean } | null>(null);
  const [paymentConfirm, setPaymentConfirm] = useState(true);
  const [statusConfig, setStatusConfig] = useState<{ key: string; label: string; notify?: boolean; confirm?: boolean }[]>([]);
  const [customFieldsConfig, setCustomFieldsConfig] = useState<{ key: string; label: string }[]>([]);
  const updateStatus = useUpdateQueueStatus();
  const startServing = useStartServing();
  const togglePayment = useMutation({
    mutationFn: (id: string) => adminApi.togglePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
  });

  const activeStatuses = statusConfig.map(s => s.key);
  const statusLabels = Object.fromEntries(statusConfig.map(s => [s.key, s.label]));
  const specialStatuses = statusConfig.filter(s => s.key === 'skipped').map(s => ({ key: s.key, label: s.label }));
  const confirmStatuses = new Set(statusConfig.filter(s => s.confirm).map(s => s.key));

  const statusBadge = useMemo(() => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; cls: string }> = {};
    for (const s of statusConfig) {
      const v = STATUS_VARIANTS[s.key];
      config[s.key] = { label: s.label, ...v };
    }
    return config;
  }, [statusConfig]);

  const handleMutation = async (fn: () => Promise<any>) => {
    setActionError('');
    try { await fn(); } catch (err: any) { setActionError(err.message || 'Gagal memperbarui status'); }
  };
  const { data: queues, isLoading } = useQueues({
    status: statusFilter || undefined,
  });
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
    adminApi.getMerchant()
      .then((m) => {
        setStatusConfig(m.statusConfig || []);
        setCustomFieldsConfig(m.customFieldsConfig || []);
        setPaymentConfirm(m.paymentConfirm !== undefined ? !!m.paymentConfirm : true);
      })
      .catch(() => {});
  }, [status]);

  const { socket: adminSocket } = useAdminSocket();

  useEffect(() => {
    if (!adminSocket) return;

    const handleNew = (payload: any) => {
      console.log('[WS Admin] queue:new', payload?.queue?.queueNumber);
      if (payload?.queue) {
        queryClient.setQueriesData<Queue[]>({ queryKey: queueKeys.all }, (old) => {
          if (!old) return old;
          if (old.some(q => q._id === payload.queue._id)) return old;
          return [payload.queue, ...old];
        });
      }
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
    };

    const handleStatus = (payload: any) => {
      console.log('[WS Admin] queue:status', payload?.queue?.queueNumber, payload?.action);
      if (payload?.queue) {
        queryClient.setQueriesData<Queue[]>({ queryKey: queueKeys.all }, (old) => {
          if (!old) return old;
          return old.map(q => q._id === payload.queue._id ? { ...q, ...payload.queue } : q);
        });
      }
    };

    adminSocket.on('queue:new', handleNew);
    adminSocket.on('queue:status', handleStatus);

    return () => {
      adminSocket.off('queue:new', handleNew);
      adminSocket.off('queue:status', handleStatus);
    };
  }, [adminSocket, queryClient]);

  if (status !== 'authenticated' || !session?.user) return null;

  const filtered = queues?.filter((q) => {
    if (!statusFilter && q.status === 'skipped') return false;
    if (!statusFilter && q.status === 'done' && q.isPaid) return false;
    return q.customerName.toLowerCase().includes(search.toLowerCase());
  }) ?? [];

  const statCards = [
    { label: 'Total Hari Ini', value: stats?.total ?? 0, icon: IconUsers, color: 'bg-blue-500' },
    { label: 'Selesai', value: stats?.done ?? 0, icon: IconCircleCheck, color: 'bg-green-500' },
    { label: 'Menunggu', value: stats?.waitingNow ?? 0, icon: IconClock, color: 'bg-yellow-500' },
    { label: 'Dilewati', value: stats?.skipped ?? 0, icon: IconPlayerSkipForward, color: 'bg-red-500' },
  ];

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Kelola antrian pelanggan dengan mudah</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/finance')} className="rounded-xl">
                <IconChartBar className="w-4 h-4 mr-1.5" />
                Statistik
              </Button>
            </div>
          </div>

          <Separator />

          <ErrorAlert message={actionError} onClose={() => setActionError('')} />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
            ))}
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama pelanggan..."
                className="pl-9 pr-10 rounded-xl"
              />
              {search && (
                <Button variant="ghost" size="icon" onClick={() => setSearch('')} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg">
                  <IconX className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] rounded-xl">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua</SelectItem>
                {activeStatuses.map((key) => (
                  <SelectItem key={key} value={key}>{statusLabels[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3 mt-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="rounded-2xl p-4">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="p-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <IconUsers className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Tidak ada antrian</h3>
                <p className="text-sm text-muted-foreground">Belum ada antrian untuk saat ini</p>
              </CardContent>
            </Card>
          ) : (
            <motion.div className="space-y-3 mt-2">
              <AnimatePresence mode="popLayout">
                {filtered.map((q, i) => (
                  <motion.div
                    key={q._id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <Card className="rounded-2xl border border-border hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xl font-bold text-primary">{q.queueNumber}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-foreground truncate">{q.customerName}</h4>
                              {statusBadge[q.status] ? (
                                <Badge variant={statusBadge[q.status]?.variant as any} className={statusBadge[q.status]?.cls}>{statusBadge[q.status]?.label}</Badge>
                              ) : (
                                <Badge variant="outline">{q.status}</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {q.customerPhone && (
                                <a
                                  href={`https://wa.me/${q.customerPhone.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  <IconBrandWhatsapp className="w-3.5 h-3.5 text-green-500" />
                                  {q.customerPhone}
                                </a>
                              )}
                              <span>{q.services?.map((s: any) => s.quantity > 1 ? `${s.name} (×${s.quantity})` : s.name).join(', ') || '-'}</span>
                            </div>
                            {q.note && (
                              <p className="text-xs text-muted-foreground/70 mt-1 italic truncate">
                                Catatan: {q.note}
                              </p>
                            )}
                            {q.customFieldValues && Object.entries(q.customFieldValues).filter(([k]) => k !== 'customerName' && k !== 'customerPhone').map(([k, v]) => {
                              const label = customFieldsConfig.find(f => f.key === k)?.label || k;
                              return (
                                <p key={k} className="text-xs text-muted-foreground/70 mt-1">
                                  {label}: {v}
                                </p>
                              );
                            })}
                          </div>
                          <QueueActions
                            queue={q}
                            activeStatuses={activeStatuses}
                            statusLabels={statusLabels}
                            specialStatuses={specialStatuses}
                            updateStatus={updateStatus}
                            startServing={startServing}
                            handleMutation={handleMutation}
                            togglePayment={togglePayment}
                            confirmStatuses={confirmStatuses}
                            onConfirmAction={(queue, status, label) => setConfirmAction({ queue, status, label })}
                            paymentConfirm={paymentConfirm}
                            onConfirmPayment={(q, isPay) => setConfirmPayment({ queue: q, isPay })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
            <DialogDescription>
              Yakin ingin mengubah status antrian <strong>{confirmAction?.queue.queueNumber} ({confirmAction?.queue.customerName})</strong> menjadi <strong>{confirmAction?.label}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="rounded-xl">Batal</Button>
            </DialogClose>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (confirmAction) {
                  handleMutation(() => updateStatus.mutateAsync({ id: confirmAction.queue._id, action: 'set', status: confirmAction.status }));
                }
                setConfirmAction(null);
              }}
              className="rounded-xl"
            >
              {updateStatus.isPending && <IconLoader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Ya
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmPayment} onOpenChange={(open) => !open && setConfirmPayment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
            <DialogDescription>
              {confirmPayment?.isPay
                ? <>Yakin antrian <strong>{confirmPayment.queue.queueNumber} ({confirmPayment.queue.customerName})</strong> sudah bayar?</>
                : <>Yakin batalkan pembayaran antrian <strong>{confirmPayment?.queue.queueNumber} ({confirmPayment?.queue.customerName})</strong>?</>
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="rounded-xl">Batal</Button>
            </DialogClose>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (confirmPayment) togglePayment.mutate(confirmPayment.queue._id);
                setConfirmPayment(null);
              }}
              className="rounded-xl"
            >
              {togglePayment.isPending && <IconLoader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Ya
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}