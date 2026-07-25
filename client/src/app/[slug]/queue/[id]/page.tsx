'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQueue } from '@/lib/hooks/useMerchant';
import { useClientStore } from '@/lib/store/clientStore';
import {
  Clock,
  CheckCircle2,
  Loader2,
  Users,
  ArrowLeft,
  AlertTriangle,
  ChevronRight,
  PartyPopper,
} from 'lucide-react';

const statusConfig = {
  pending_payment: { label: 'Menunggu Pembayaran', color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200', icon: AlertTriangle },
  waiting: { label: 'Menunggu', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', icon: Clock },
  called: { label: 'Dipanggil', color: 'text-green-500', bg: 'bg-green-50 border-green-200', icon: CheckCircle2 },
  serving: { label: 'Sedang Dilayani', color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200', icon: Users },
  done: { label: 'Selesai', color: 'text-green-600', bg: 'bg-green-50 border-green-300', icon: PartyPopper },
  skipped: { label: 'Dilewati', color: 'text-red-500', bg: 'bg-red-50 border-red-200', icon: AlertTriangle },
};

export default function QueueTrackingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const queueId = params.id as string;
  const { currentQueue } = useClientStore();
  const { data: liveData } = useLiveQueue(slug);

  const myQueue = liveData?.waiting?.find((q) => q._id === queueId)
    || liveData?.current?._id === queueId ? liveData.current : null;

  const queue = currentQueue || myQueue;
  const statusInfo = queue ? statusConfig[queue.status] : statusConfig.waiting;

  const myPosition = liveData?.waiting?.findIndex((q) => q._id === queueId) ?? -1;
  const positionInLine = myPosition >= 0 ? myPosition + 1 : 0;

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
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link href={`/${slug}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Kembali</span>
          </Link>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <motion.div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusInfo.bg} ${statusInfo.color} text-sm font-medium mb-4`}
            layout
          >
            <motion.div
              animate={queue.status === 'waiting' || queue.status === 'pending_payment' ? { rotate: 360 } : {}}
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
        </motion.div>

        {queue.status === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-6 mb-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {positionInLine > 0 ? positionInLine : '-'}
                </p>
                <p className="text-sm text-gray-500">Antrian di depanmu</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-3 mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">
            Antrian Saat Ini
          </h3>

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
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </>
          )}
        </div>

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