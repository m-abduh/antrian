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
  IconBell,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_FALLBACK: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  waiting: { label: 'Menunggu', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800', icon: IconClock },
  called: { label: 'Dipanggil!', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800', icon: IconBell },
  serving: { label: 'Sedang Dilayani', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800', icon: IconUsers },
  done: { label: 'Selesai', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800', icon: IconTrophy },
  skipped: { label: 'Dilewati', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800', icon: IconAlertTriangle },
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AnimatePresence>
        {called && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-5 md:py-6 text-center shadow-2xl shadow-emerald-500/20"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <IconBell className="w-7 h-7 md:w-9 md:h-9 mx-auto mb-1.5" />
            </motion.div>
            <p className="text-xl md:text-2xl font-bold tracking-tight">Anda Dipanggil!</p>
            <p className="text-sm md:text-base text-white/80 mt-0.5">Silakan menuju ke lokasi</p>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        <div className="md:grid md:grid-cols-2 md:gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Back */}
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center group-hover:bg-muted-foreground/10 transition-colors">
                  <IconArrowLeft className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium">Kembali</span>
              </Link>
            </div>

            {/* Status Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              {/* Status badge */}
              <motion.div
                layout
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-5 shadow-sm ${statusInfo.bg} ${statusInfo.color} text-xs md:text-sm font-medium`}
              >
                <motion.div
                  animate={queue.status === 'waiting' ? { rotate: 360 } : queue.status === 'serving' ? { scale: [1, 1.2, 1] } : {}}
                  transition={queue.status === 'waiting' ? { repeat: Infinity, duration: 2, ease: 'linear' } : { repeat: Infinity, duration: 1.5 }}
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

              {/* Queue Number */}
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 10 }}
              >
                <div className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-foreground mb-2 tracking-tight">
                  {queue.queueNumber}
                </div>
                <p className="text-sm md:text-base text-muted-foreground font-medium">{queue.customerName}</p>
              </motion.div>

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
                  className={`mt-5 rounded-full ${
                    permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''
                  } ${permission === 'granted' ? 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' : ''}`}
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

            {/* Position Card (waiting) */}
            {queue.status === 'waiting' && positionInLine > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
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
                    <div className="relative w-full bg-muted rounded-full h-2.5 md:h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
                      />
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-2 text-center">
                      {progressPercent}% antrian telah selesai
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Serving Card */}
            {queue.status === 'serving' && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />
                <motion.div
                  className="absolute -top-10 -right-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                />
                <Card className="relative rounded-2xl border-violet-200/50 dark:border-violet-800/50 shadow-sm">
                  <CardContent className="p-6 md:p-7 text-center">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-14 h-14 md:w-16 md:h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    >
                      <IconUsers className="w-7 h-7 md:w-8 md:h-8 text-violet-600 dark:text-violet-400" />
                    </motion.div>
                    <h3 className="text-lg md:text-xl font-bold text-foreground">Sedang Dilayani</h3>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">Mohon bersiap jika dipanggil</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Queue List */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-green-500" />
                Antrian Saat Ini
              </h3>

              {liveData?.current ? (
                <Card className="rounded-2xl border-l-[3px] border-l-green-500 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-5 flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <IconCircleCheck className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm md:text-base text-foreground">{liveData.current.queueNumber}</p>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">{liveData.current.customerName}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-2xl bg-muted/30">
                  <CardContent className="p-5 text-center">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-2">
                      <IconUsers className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Belum ada antrian yang dilayani</p>
                  </CardContent>
                </Card>
              )}

              {liveData && liveData.waiting.length > 0 && (
                <>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 pt-2">
                    <span className="w-1 h-4 rounded-full bg-primary" />
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
                          <Card className={`rounded-2xl overflow-hidden transition-all hover:shadow-sm ${
                            isMe ? 'border-primary/50 bg-gradient-to-r from-primary/[0.03] to-transparent shadow-sm' : ''
                          }`}>
                            <CardContent className="p-3.5 md:p-4 flex items-center gap-3">
                              <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                                isMe
                                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {q.queueNumber}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm md:text-base truncate">
                                  {q.customerName}
                                  {isMe && <span className="text-[10px] md:text-xs ml-1.5 text-primary font-medium">(Kamu)</span>}
                                </p>
                                {q.services?.length > 0 && (
                                  <p className="text-xs md:text-sm text-muted-foreground truncate mt-0.5">{q.services.map((s: QueueService) => s.quantity > 1 ? `${s.name} (×${s.quantity})` : s.name).join(', ')}</p>
                                )}
                              </div>
                              <IconChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
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
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="rounded-2xl border-amber-200/50 dark:border-amber-800/50 shadow-sm">
                  <CardContent className="p-5 md:p-6 text-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <IconTrophy className="w-7 h-7 md:w-8 md:h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-foreground mb-1">Selesai!</h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-4">Bagaimana pelayanan kami?</p>
                    <div className="flex justify-center gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRating(star)}
                          disabled={ratingLoading}
                          className="focus:outline-none transition-transform"
                        >
                          <IconStar
                            className={`w-8 h-8 md:w-9 md:h-9 transition-all ${
                              star <= rating
                                ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                                : 'text-muted-foreground/25'
                            }`}
                          />
                        </motion.button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <div className="space-y-3">
                        <textarea
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                          placeholder="Tulis komentar (opsional)..."
                          rows={2}
                          className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                        />
                        <button
                          onClick={submitRating}
                          disabled={ratingLoading}
                          className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20"
                        >
                          {ratingLoading ? (
                            <><IconLoader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                          ) : (
                            'Kirim Penilaian'
                          )}
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {ratingSent && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="rounded-2xl border-emerald-200/50 dark:border-emerald-800/50 shadow-sm">
                  <CardContent className="p-5 md:p-6 text-center bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                      <IconCircleCheck className="w-10 h-10 md:w-12 md:h-12 text-emerald-500 mx-auto mb-2" />
                    </motion.div>
                    <p className="text-base md:text-lg text-emerald-600 dark:text-emerald-400 font-semibold">Terima kasih atas penilaiannya!</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
