'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMerchant, useLiveQueue } from '@/lib/hooks/useMerchant';
import { useClientStore } from '@/lib/store/clientStore';
import { useNotification } from '@/lib/hooks/useNotification';
import { merchantApi } from '@/lib/api/merchant';
import { getCustomerSocket } from '@/lib/socket';
import api from '@/lib/axios';
import type { Queue, QueueService } from '@/lib/types';
import { updateActiveQueueStatus } from '@/lib/activeQueue';
import {
  IconClock, IconCircleCheck, IconLoader2, IconUsers, IconArrowLeft,
  IconAlertTriangle, IconChevronRight, IconTrophy, IconStar,
  IconBell, IconWavesElectricity,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_FALLBACK: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  waiting: { label: 'Menunggu', color: 'text-foreground', bg: 'bg-muted border-border', icon: IconClock },
  called: { label: 'Dipanggil!', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800', icon: IconBell },
  serving: { label: 'Sedang Dilayani', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800', icon: IconUsers },
  done: { label: 'Selesai', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800', icon: IconTrophy },
  skipped: { label: 'Dilewati', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800', icon: IconAlertTriangle },
};

export function QueueClient({ slug, queueId }: { slug: string; queueId: string }) {
  const queryClient = useQueryClient();
  const { currentQueue, setQueue } = useClientStore();
  const { data: merchant } = useMerchant(slug);
  const { data: liveData, isLoading: liveLoading } = useLiveQueue(slug);
  const { data: fetchedQueue, isLoading: queueLoading } = useQuery<Queue>({
    queryKey: ['queue', slug, queueId],
    queryFn: () => merchantApi.getQueue(slug, queueId),
    staleTime: 0,
    refetchInterval: 15_000,
  });

  const statusConfigDynamic = merchant?.statusConfig?.reduce((acc, s) => {
    const fb = STATUS_FALLBACK[s.key];
    acc[s.key] = {
      label: s.label,
      color: fb?.color || 'text-foreground',
      bg: fb?.bg || 'bg-muted border-border',
      icon: fb?.icon || IconClock,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string; bg: string; icon: any }>) || STATUS_FALLBACK;

  const [called, setCalled] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSent, setRatingSent] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const { permission, subscribe } = useNotification();

  const myQueue = liveData?.waiting?.find((q) => q._id === queueId)
    || (liveData?.current?._id === queueId ? liveData.current : null);

  const validCurrent = currentQueue && (currentQueue._id === queueId || (currentQueue as any).id === queueId);

  if (!slug) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const queue = validCurrent ? currentQueue : (myQueue || fetchedQueue);
  const statusInfo = queue ? (statusConfigDynamic[queue.status] || statusConfigDynamic.waiting) : statusConfigDynamic.waiting;

  useEffect(() => {
    if (queue && (queue.status === 'done' || queue.status === 'skipped')) {
      updateActiveQueueStatus(slug, queue.status);
    }
  }, [queue, slug]);

  const myPosition = liveData?.waiting?.findIndex((q) => q._id === queueId) ?? -1;
  const positionInLine = myPosition >= 0 ? myPosition + 1 : 0;
  const totalInLine = liveData?.waiting?.length ?? 0;

  useEffect(() => {
    const socket = getCustomerSocket(slug);

    const handleStatus = (data: { queue: Queue; action: string }) => {
      const qid = (data.queue as any).id ?? data.queue._id;
      if (qid === queueId) {
        setQueue(data.queue);
        if (data.queue.status === 'done' || data.queue.status === 'skipped') {
          updateActiveQueueStatus(slug, data.queue.status);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['liveQueue', slug] });
    };

    const handleNew = () => {
      queryClient.invalidateQueries({ queryKey: ['liveQueue', slug] });
    };

    socket.on('queue:status', handleStatus);
    socket.on('queue:new', handleNew);

    return () => {
      socket.off('queue:status', handleStatus);
      socket.off('queue:new', handleNew);
    };
  }, [slug, queueId, setQueue, queryClient]);

  useEffect(() => {
    if (queue?.status === 'called') setCalled(true);
  }, [queue?.status]);

  useEffect(() => {
    if (called) {
      const timer = setTimeout(() => setCalled(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [called]);

  const handleRating = useCallback((value: number) => {
    setRating(value);
  }, []);

  const submitRating = useCallback(async () => {
    if (!rating) return;
    setRatingLoading(true);
    try {
      await api.post(`/merchant/${slug}/queue/${queueId}/rating`, { rating, comment: ratingComment });
      setRatingSent(true);
    } catch {
      setRating(0);
    } finally {
      setRatingLoading(false);
    }
  }, [slug, queueId, rating, ratingComment]);

  const progressPercent = totalInLine > 0
    ? Math.round(((totalInLine - positionInLine) / totalInLine) * 100)
    : queue?.status === 'serving' || queue?.status === 'done' ? 100 : 0;

  const isLoading = liveLoading || (queueLoading && !currentQueue);

  if (isLoading && !queue) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-20 w-40 mx-auto rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <IconLoader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Memuat antrian...</h2>
          <p className="text-sm text-muted-foreground">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>
        {called && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white p-4 md:p-5 text-center shadow-lg"
          >
            <IconBell className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 animate-bounce" />
            <p className="text-lg md:text-xl font-bold">Anda Dipanggil!</p>
            <p className="text-xs md:text-sm opacity-90">Silakan menuju ke lokasi</p>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <IconArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Kembali</span>
          </Link>
          <div className="flex items-center gap-2">
            <IconWavesElectricity className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm text-foreground">Tunggu.id</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-6">
          {/* Status badge */}
          <motion.div
            layout
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-5 ${statusInfo.bg} ${statusInfo.color} text-xs md:text-sm font-medium`}
          >
            <motion.div
              animate={queue.status === 'waiting' ? { rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            >
              {queue.status === 'waiting' ? (
                <IconLoader2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              ) : (
                <StatusIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
              )}
            </motion.div>
            {statusInfo.label}
          </motion.div>

          {queue.isPaid && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-5">
              <IconCircleCheck className="w-3.5 h-3.5" />
              Sudah Dibayar
            </div>
          )}

          {/* Queue number */}
          <motion.div
            className="text-6xl md:text-7xl lg:text-8xl font-bold text-foreground mb-3 tracking-tight"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 10 }}
          >
            {queue.queueNumber}
          </motion.div>
          <p className="text-sm md:text-base text-muted-foreground">{queue.customerName}</p>

          {queue.status === 'waiting' && (
            <Button
              variant={permission === 'granted' ? 'outline' : 'default'}
              size="sm"
              onClick={async () => {
                setNotifLoading(true);
                await subscribe(slug);
                setNotifLoading(false);
              }}
              disabled={notifLoading || permission === 'denied'}
              className={`mt-4 rounded-full ${
                permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''
              } ${permission === 'granted' ? 'border-green-200 dark:border-green-800 text-green-600 dark:text-green-400' : ''}`}
            >
              {notifLoading ? (
                <IconLoader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <IconBell className="w-3.5 h-3.5 mr-1.5" />
              )}
              {permission === 'granted' ? 'Notifikasi aktif' : permission === 'denied' ? 'Notifikasi diblokir' : 'Aktifkan notifikasi'}
            </Button>
          )}
        </motion.div>

        {/* Position card */}
        {queue.status === 'waiting' && positionInLine > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
            <Card className="rounded-2xl overflow-hidden">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-full flex items-center justify-center">
                      <IconUsers className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl md:text-3xl font-bold text-foreground">{positionInLine}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">dari {totalInLine} antrian</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl md:text-2xl font-bold text-foreground">~{positionInLine * 10}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">menit estimasi</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 md:h-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="bg-primary h-full rounded-full"
                  />
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-2 text-center">
                  {progressPercent}% antrian telah selesai
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Serving status */}
        {queue.status === 'serving' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
            <Card className="border-purple-500/20 rounded-2xl overflow-hidden">
              <CardContent className="p-5 md:p-6 text-center bg-purple-500/5">
                <IconUsers className="w-8 h-8 md:w-10 md:h-10 text-purple-500 mx-auto mb-2" />
                <h3 className="text-base md:text-lg font-bold text-foreground">Sedang Dilayani</h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Mohon bersiap jika dipanggil</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Queue list */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Antrian Saat Ini</h3>

          {liveData?.current ? (
            <Card className={`rounded-2xl overflow-hidden border-l-4 border-l-green-500`}>
              <CardContent className="p-4 md:p-5 flex items-center gap-3 md:gap-4">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                  <IconCircleCheck className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm md:text-base text-foreground">{liveData.current.queueNumber}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{liveData.current.customerName}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl">
              <CardContent className="p-5 text-center">
                <p className="text-xs md:text-sm text-muted-foreground">Belum ada antrian yang dilayani</p>
              </CardContent>
            </Card>
          )}

          {liveData && liveData.waiting.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mt-4">
                Menunggu ({liveData.waiting.length})
              </h3>
              <AnimatePresence>
                {liveData.waiting.slice(0, 5).map((q, i) => {
                  const isMe = q._id === queueId;
                  return (
                    <motion.div
                      key={q._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className={`rounded-2xl overflow-hidden ${
                        isMe ? 'border-primary bg-primary/[0.03]' : ''
                      }`}>
                        <CardContent className="p-3 md:p-4 flex items-center gap-3">
                          <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            <span className="font-semibold text-xs md:text-sm">{q.queueNumber}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm md:text-base truncate">
                              {q.customerName}
                              {isMe && <span className="text-[10px] md:text-xs ml-1.5 text-primary">(Kamu)</span>}
                            </p>
                              {q.services?.length > 0 && (
                              <p className="text-xs md:text-sm text-muted-foreground truncate">{q.services.map((s: QueueService) => s.quantity > 1 ? `${s.name} (×${s.quantity})` : s.name).join(', ')}</p>
                            )}
                          </div>
                          <IconChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Rating */}
        {queue.status === 'done' && !ratingSent && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
            <Card className="rounded-2xl text-center">
              <CardContent className="p-5 md:p-6">
                <IconTrophy className="w-8 h-8 md:w-10 md:h-10 text-green-500 mx-auto mb-2" />
                <h3 className="text-base md:text-lg font-bold text-foreground mb-1">Selesai!</h3>
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">Bagaimana pelayanan kami?</p>
                <div className="flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRating(star)}
                      disabled={ratingLoading}
                      className="focus:outline-none"
                    >
                      <IconStar
                        className={`w-7 h-7 md:w-8 md:h-8 ${
                          star <= rating
                            ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>
                {rating > 0 && (
                  <>
                    <textarea
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Tulis komentar (opsional)..."
                      rows={2}
                      className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      onClick={submitRating}
                      disabled={ratingLoading}
                      className="mt-2 w-full h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                    >
                      {ratingLoading ? (
                        <><IconLoader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                      ) : (
                        'Kirim Penilaian'
                      )}
                    </button>
                  </>
                )}
                {ratingLoading && <IconLoader2 className="w-5 h-5 animate-spin text-primary mx-auto mt-2" />}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {ratingSent && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
            <Card className="border-green-500/20 rounded-2xl">
              <CardContent className="p-4 md:p-5 text-center bg-green-500/5">
                <IconCircleCheck className="w-6 h-6 md:w-8 md:h-8 text-green-500 mx-auto mb-1" />
                <p className="text-sm md:text-base text-green-600 dark:text-green-400 font-medium">Terima kasih atas penilaiannya!</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Done today */}
        {liveData && (
          <Card className="bg-primary/[0.03] border-primary/[0.1] rounded-2xl">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-foreground font-medium">Selesai hari ini</span>
                <span className="text-primary font-bold text-base md:text-lg">{liveData.doneToday}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
