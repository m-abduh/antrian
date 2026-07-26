'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLiveQueue } from '@/lib/hooks/useMerchant';
import { useClientStore } from '@/lib/store/clientStore';
import { useNotification } from '@/lib/hooks/useNotification';
import { merchantApi } from '@/lib/api/merchant';
import api from '@/lib/axios';
import type { Queue } from '@/lib/types';
import {
  Clock, CheckCircle2, Loader2, Users, ArrowLeft,
  AlertTriangle, ChevronRight, PartyPopper, Star,
  Bell, Timer,
} from 'lucide-react';

const statusConfig = {
  waiting: { label: 'Menunggu', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-300', icon: Clock },
  called: { label: 'Dipanggil!', color: 'text-green-600', bg: 'bg-green-50 border-green-300', icon: Bell },
  serving: { label: 'Sedang Dilayani', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-300', icon: Users },
  done: { label: 'Selesai', color: 'text-green-700', bg: 'bg-green-50 border-green-300', icon: PartyPopper },
  skipped: { label: 'Dilewati', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: AlertTriangle },
};

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />;
}

export default function QueueTrackingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const queueId = params.id as string;
  const { currentQueue, setQueue } = useClientStore();
  const { data: liveData, isLoading: liveLoading } = useLiveQueue(slug);
  const { data: fetchedQueue, isLoading: queueLoading } = useQuery<Queue>({
    queryKey: ['queue', slug, queueId],
    queryFn: () => merchantApi.getQueue(slug, queueId),
    enabled: !currentQueue,
    refetchInterval: 15000,
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

  const myPosition = liveData?.waiting?.findIndex((q) => q._id === queueId) ?? -1;
  const positionInLine = myPosition >= 0 ? myPosition + 1 : 0;
  const totalInLine = liveData?.waiting?.length ?? 0;

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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-16 w-48 mx-auto" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm mx-auto px-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Memuat antrian...</h2>
          <p className="text-sm text-gray-500">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence>
        {called && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white p-4 text-center shadow-lg"
          >
            <Bell className="w-6 h-6 mx-auto mb-1" />
            <p className="text-lg font-bold">Anda Dipanggil!</p>
            <p className="text-sm opacity-90">Silakan menuju ke lokasi</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link href={`/${slug}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Kembali</span>
          </Link>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-8">
          <motion.div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusInfo.bg} ${statusInfo.color} text-sm font-medium mb-4`}
            layout
          >
            <motion.div
              animate={queue.status === 'waiting' ? { rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            >
              {queue.status === 'waiting' ? (
                <Loader2 className="w-4 h-4" />
              ) : (
                <statusInfo.icon className="w-4 h-4" />
              )}
            </motion.div>
            {statusInfo.label}
          </motion.div>

          <motion.h1
            className="text-6xl font-bold text-gray-900 mb-4"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 10 }}
          >
            {queue.queueNumber}
          </motion.h1>
          <p className="text-gray-500">{queue.customerName}</p>

          {queue.status === 'waiting' && (
            <motion.button
              onClick={async () => {
                setNotifLoading(true);
                await subscribe(slug);
                setNotifLoading(false);
              }}
              disabled={notifLoading || permission === 'denied'}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all mt-4 ${
                permission === 'granted'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : permission === 'denied'
                  ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              {notifLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              {permission === 'granted' ? 'Notifikasi aktif' : permission === 'denied' ? 'Notifikasi diblokir' : 'Aktifkan notifikasi'}
            </motion.button>
          )}
        </motion.div>

        {queue.status === 'waiting' && positionInLine > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
                    <Users className="w-7 h-7 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{positionInLine}</p>
                    <p className="text-sm text-gray-500">dari {totalInLine} antrian</p>
                  </div>
                </div>
                <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center">
                  <Timer className="w-7 h-7 text-orange-500" />
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">
                    ~{positionInLine * 10} menit
                  </p>
                  <p className="text-sm text-gray-500">estimasi</p>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1 }}
                  className="bg-blue-500 h-3 rounded-full"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {progressPercent}% antrian telah selesai
              </p>
            </div>
          </motion.div>
        )}

        {queue.status === 'serving' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-purple-50 border border-purple-200 rounded-2xl p-6 mb-4 text-center">
            <Users className="w-10 h-10 text-purple-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-purple-900">Sedang Dilayani</h3>
            <p className="text-sm text-purple-700">Mohon bersiap jika dipanggil</p>
          </motion.div>
        )}

        <div className="space-y-3 mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">Antrian Saat Ini</h3>

          {liveData?.current && (
            <div className="bg-white rounded-2xl shadow-sm p-4 border-l-4 border-green-400 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{liveData.current.queueNumber}</p>
                <p className="text-sm text-gray-500">{liveData.current.customerName}</p>
              </div>
            </div>
          )}

          {!liveData?.current && (
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <p className="text-gray-500">Belum ada antrian yang dilayani</p>
            </div>
          )}

          {liveData && liveData.waiting.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1 mt-6">
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
                      className={`bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 ${isMe ? 'border-2 border-blue-300 bg-blue-50' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMe ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <span className="font-semibold text-sm">{q.queueNumber}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isMe ? 'text-blue-900' : 'text-gray-900'}`}>
                          {q.customerName}
                          {isMe && <span className="text-xs ml-2 text-blue-500">(Kamu)</span>}
                        </p>
                        {q.serviceId && typeof q.serviceId !== 'string' && (
                          <p className="text-sm text-gray-500 truncate">{q.serviceId.name}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </>
          )}
        </div>

        {queue.status === 'done' && !ratingSent && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm p-6 mb-4 text-center">
            <PartyPopper className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Selesai!</h3>
            <p className="text-sm text-gray-500 mb-4">Bagaimana pelayanan kami?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleRating(star)}
                  disabled={ratingLoading}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                </motion.button>
              ))}
            </div>
            {ratingLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto mt-2" />}
          </motion.div>
        )}

        {ratingSent && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 rounded-2xl p-4 border border-green-200 text-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-1" />
            <p className="text-green-800 font-medium">Terima kasih atas penilaiannya!</p>
          </motion.div>
        )}

        {liveData && (
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-800 font-medium">Selesai hari ini</span>
              <span className="text-blue-600 font-bold">{liveData.doneToday}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
