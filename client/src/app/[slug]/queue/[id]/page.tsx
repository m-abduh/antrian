'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLiveQueue } from '@/lib/hooks/useMerchant';
import { useClientStore } from '@/lib/store/clientStore';
import { useNotification } from '@/lib/hooks/useNotification';
import { merchantApi } from '@/lib/api/merchant';
import { getCustomerSocket, disconnectCustomerSocket } from '@/lib/socket';
import api from '@/lib/axios';
import type { Queue } from '@/lib/types';
import { clearActiveQueue } from '@/lib/activeQueue';
import {
  IconClock, IconCircleCheck, IconLoader2, IconUsers, IconArrowLeft,
  IconAlertTriangle, IconChevronRight, IconTrophy, IconStar,
  IconBell, IconAlarm, IconWavesElectricity,
} from '@tabler/icons-react';

const statusConfig = {
  waiting: { label: 'Menunggu', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800', icon: IconClock },
  called: { label: 'Dipanggil!', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800', icon: IconBell },
  serving: { label: 'Sedang Dilayani', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800', icon: IconUsers },
  done: { label: 'Selesai', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800', icon: IconTrophy },
  skipped: { label: 'Dilewati', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800', icon: IconAlertTriangle },
};

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-muted rounded-xl animate-pulse ${className}`} />;
}

export default function QueueTrackingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const queueId = params.id as string;
  const queryClient = useQueryClient();
  const { currentQueue, setQueue } = useClientStore();
  const { data: liveData, isLoading: liveLoading } = useLiveQueue(slug);
  const { data: fetchedQueue, isLoading: queueLoading } = useQuery<Queue>({
    queryKey: ['queue', slug, queueId],
    queryFn: () => merchantApi.getQueue(slug, queueId),
    enabled: !currentQueue,
  });
  const [called, setCalled] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSent, setRatingSent] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const { permission, subscribe } = useNotification();

  const myQueue = liveData?.waiting?.find((q) => q._id === queueId)
    || (liveData?.current?._id === queueId ? liveData.current : null);

  const queue = currentQueue || myQueue || fetchedQueue;
  const statusInfo = queue ? statusConfig[queue.status] : statusConfig.waiting;

  useEffect(() => {
    if (queue && (queue.status === 'done' || queue.status === 'skipped')) {
      clearActiveQueue(slug);
    }
  }, [queue, slug]);

  const myPosition = liveData?.waiting?.findIndex((q) => q._id === queueId) ?? -1;
  const positionInLine = myPosition >= 0 ? myPosition + 1 : 0;
  const totalInLine = liveData?.waiting?.length ?? 0;

  useEffect(() => {
    const socket = getCustomerSocket(slug);

    socket.on('queue:status', (data: { queue: Queue; action: string }) => {
      if (data.queue._id === queueId) {
        setQueue(data.queue);
        if (data.queue.status === 'done' || data.queue.status === 'skipped') {
          clearActiveQueue(slug);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['liveQueue', slug] });
    });

    socket.on('queue:new', () => {
      queryClient.invalidateQueries({ queryKey: ['liveQueue', slug] });
    });

    return () => {
      socket.off('queue:status');
      socket.off('queue:new');
      disconnectCustomerSocket();
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

  const handleRating = useCallback(async (value: number) => {
    setRating(value);
    setRatingLoading(true);
    try {
      await api.post(`/merchant/${slug}/queue/${queueId}/rating`, { rating: value });
      setRatingSent(true);
    } catch {
      setRating(0);
    } finally {
      setRatingLoading(false);
    }
  }, [slug, queueId]);

  const progressPercent = totalInLine > 0
    ? Math.round(((totalInLine - positionInLine) / totalInLine) * 100)
    : queue?.status === 'serving' || queue?.status === 'done' ? 100 : 0;

  const isLoading = liveLoading || (queueLoading && !currentQueue);

  if (isLoading && !queue) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-20 w-40 mx-auto" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-28 w-full" />
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
        <div className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${slug}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <IconArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Kembali</span>
          </Link>
          <div className="flex items-center gap-2">
            <IconWavesElectricity className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm text-foreground">Antriin</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-6 md:mb-8">
          <motion.div
            className={`inline-flex items-center gap-2 px-4 md:px-5 py-1.5 md:py-2 rounded-full border ${statusInfo.bg} ${statusInfo.color} text-xs md:text-sm font-medium mb-4 md:mb-6`}
            layout
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

          <motion.div
            className="text-6xl md:text-7xl lg:text-8xl font-bold text-foreground mb-3 md:mb-4 tracking-tight"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 10 }}
          >
            {queue.queueNumber}
          </motion.div>
          <p className="text-sm md:text-base text-muted-foreground">{queue.customerName}</p>

          {queue.status === 'waiting' && (
            <motion.button
              onClick={async () => {
                setNotifLoading(true);
                await subscribe(slug);
                setNotifLoading(false);
              }}
              disabled={notifLoading || permission === 'denied'}
              className={`inline-flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all mt-4 md:mt-5 ${
                permission === 'granted'
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : permission === 'denied'
                  ? 'bg-muted text-muted-foreground border border-border cursor-not-allowed'
                  : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
              }`}
            >
              {notifLoading ? (
                <IconLoader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
              ) : (
                <IconBell className="w-3.5 h-3.5 md:w-4 md:h-4" />
              )}
              {permission === 'granted' ? 'Notifikasi aktif' : permission === 'denied' ? 'Notifikasi diblokir' : 'Aktifkan notifikasi'}
            </motion.button>
          )}
        </motion.div>

        {queue.status === 'waiting' && positionInLine > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5 md:mb-6">
            <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
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
                  className="bg-primary h-2 md:h-2.5 rounded-full"
                />
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-2 md:mt-3 text-center">
                {progressPercent}% antrian telah selesai
              </p>
            </div>
          </motion.div>
        )}

        {queue.status === 'serving' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5 md:p-6 mb-5 md:mb-6 text-center">
            <IconUsers className="w-8 h-8 md:w-10 md:h-10 text-purple-500 dark:text-purple-400 mx-auto mb-2" />
            <h3 className="text-base md:text-lg font-bold text-foreground">Sedang Dilayani</h3>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Mohon bersiap jika dipanggil</p>
          </motion.div>
        )}

        <div className="space-y-3 mb-6 md:mb-8">
          <h3 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Antrian Saat Ini</h3>

          {liveData?.current ? (
            <div className="bg-card border border-border rounded-2xl p-4 md:p-5 border-l-4 border-l-green-500 flex items-center gap-3 md:gap-4 shadow-sm">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                <IconCircleCheck className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base text-foreground">{liveData.current.queueNumber}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{liveData.current.customerName}</p>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-5 md:p-6 text-center">
              <p className="text-xs md:text-sm text-muted-foreground">Belum ada antrian yang dilayani</p>
            </div>
          )}

          {liveData && liveData.waiting.length > 0 && (
            <>
              <h3 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1 mt-4 md:mt-6">
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
                      className={`bg-card border rounded-2xl p-3 md:p-4 flex items-center gap-3 shadow-sm ${
                        isMe ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <span className="font-semibold text-xs md:text-sm">{q.queueNumber}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm md:text-base truncate ${isMe ? 'text-foreground' : 'text-foreground'}`}>
                          {q.customerName}
                          {isMe && <span className="text-[10px] md:text-xs ml-1.5 text-primary">(Kamu)</span>}
                        </p>
                        {q.services?.length > 0 && (
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{q.services.map((s: any) => s.name).join(', ')}</p>
                        )}
                      </div>
                      <IconChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </>
          )}
        </div>

        {queue.status === 'done' && !ratingSent && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 md:p-6 mb-5 md:mb-6 text-center shadow-sm">
            <IconTrophy className="w-8 h-8 md:w-10 md:h-10 text-green-500 mx-auto mb-2" />
            <h3 className="text-base md:text-lg font-bold text-foreground mb-1">Selesai!</h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">Bagaimana pelayanan kami?</p>
            <div className="flex justify-center gap-1.5 md:gap-2">
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
                    className={`w-7 h-7 md:w-8 md:h-8 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
                  />
                </motion.button>
              ))}
            </div>
            {ratingLoading && <IconLoader2 className="w-5 h-5 animate-spin text-primary mx-auto mt-2 md:mt-3" />}
          </motion.div>
        )}

        {ratingSent && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 md:p-5 text-center mb-5 md:mb-6">
            <IconCircleCheck className="w-6 h-6 md:w-8 md:h-8 text-green-500 mx-auto mb-1" />
            <p className="text-sm md:text-base text-green-600 dark:text-green-400 font-medium">Terima kasih atas penilaiannya!</p>
          </motion.div>
        )}

        {liveData && (
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="text-foreground font-medium">Selesai hari ini</span>
              <span className="text-primary font-bold text-base md:text-lg">{liveData.doneToday}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
