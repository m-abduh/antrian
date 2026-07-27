'use client';

import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useCreateQueue } from '@/lib/hooks/useCreateQueue';
import { useClientStore } from '@/lib/store/clientStore';
import { motion, AnimatePresence } from 'framer-motion';
import { IconUser, IconPhone, IconLoader2, IconArrowLeft, IconAlertCircle, IconX, IconWavesElectricity } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { saveActiveQueue } from '@/lib/activeQueue';

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { selectedMerchant, selectedService, setQueue } = useClientStore();
  const createQueue = useCreateQueue(slug);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    customerName: string;
    customerPhone: string;
    serviceId: string;
  }>({
    defaultValues: {
      customerName: '',
      customerPhone: '',
      serviceId: selectedService?._id || '',
    },
  });

  useEffect(() => {
    if (!selectedMerchant || !selectedService) {
      router.replace(`/${slug}`);
    }
  }, [selectedMerchant, selectedService, router, slug]);

  if (!selectedMerchant || !selectedService) {
    return null;
  }

  const onSubmit = useCallback(async (data: { customerName: string; customerPhone: string; serviceId: string }) => {
    setError('');
    try {
      const result = await createQueue.mutateAsync({
        serviceIds: [data.serviceId],
        customerName: data.customerName,
        customerPhone: data.customerPhone,
      });
      setQueue(result.queue as never);
      saveActiveQueue(slug, { queueId: result.queue.id, number: result.queue.queueNumber, status: 'waiting' });
      router.push(`/${slug}/queue/${result.queue.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.');
    }
  }, [createQueue, slug, setQueue, router]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${slug}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <IconArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Kembali</span>
          </Link>
          <div className="flex items-center gap-2">
            <IconWavesElectricity className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm text-foreground">Tunggu.id</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6 p-3 md:p-4 bg-muted rounded-xl">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-base md:text-xl font-bold">{selectedService.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base md:text-lg font-bold text-foreground truncate">{selectedService.name}</h1>
                <div className="flex items-center gap-2 md:gap-3 mt-1 text-xs md:text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {selectedService.price > 0
                      ? `Rp${selectedService.price.toLocaleString('id-ID')}`
                      : 'Gratis'}
                  </span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 md:p-4 mb-4 md:mb-5 flex items-start gap-2 md:gap-3"
                >
                  <IconAlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs md:text-sm text-red-600 dark:text-red-400 flex-1">{error}</p>
                  <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 transition-colors">
                    <IconX className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
              <input type="hidden" {...register('serviceId')} />

              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-foreground mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                  <input
                    id="customerName"
                    {...register('customerName', {
                      required: 'Nama wajib diisi',
                      maxLength: { value: 100, message: 'Nama maksimal 100 karakter' },
                    })}
                    className="w-full pl-10 md:pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm placeholder:text-muted-foreground/60"
                    placeholder="Masukkan nama Anda"
                    disabled={createQueue.isPending}
                  />
                </div>
                {errors.customerName && (
                  <p className="mt-1.5 text-xs md:text-sm text-red-500 flex items-center gap-1">
                    <IconAlertCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    {errors.customerName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-foreground mb-1.5">
                  Nomor Telepon
                </label>
                <div className="relative">
                  <IconPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                  <input
                    id="customerPhone"
                    {...register('customerPhone', {
                      pattern: {
                        value: /^\+?[0-9]{10,15}$/,
                        message: 'Format nomor tidak valid (10-15 digit)',
                      },
                    })}
                    className="w-full pl-10 md:pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm placeholder:text-muted-foreground/60"
                    placeholder="08xxxxxxxxxx"
                    disabled={createQueue.isPending}
                  />
                </div>
                {errors.customerPhone && (
                  <p className="mt-1.5 text-xs md:text-sm text-red-500 flex items-center gap-1">
                    <IconAlertCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    {errors.customerPhone.message}
                  </p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={createQueue.isPending}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm text-sm md:text-base"
              >
                {createQueue.isPending ? (
                  <>
                    <IconLoader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Dapatkan Antrian'
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
