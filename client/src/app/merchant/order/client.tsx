'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useCreateQueue } from '@/lib/hooks/useCreateQueue';
import { useClientStore } from '@/lib/store/clientStore';
import { motion, AnimatePresence } from 'framer-motion';
import { IconUser, IconPhone, IconLoader2, IconArrowLeft, IconAlertCircle, IconX, IconWavesElectricity } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { saveActiveQueue } from '@/lib/activeQueue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export function OrderClient({ slug }: { slug: string }) {
  const router = useRouter();
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
      router.replace('/');
    }
  }, [selectedMerchant, selectedService, router]);

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
      router.push(`/queue/${result.queue.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.');
    }
  }, [createQueue, slug, setQueue, router]);

  return (
    <div className="min-h-screen bg-background">
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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Service info */}
          <Card className="rounded-2xl overflow-hidden">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-base md:text-xl font-bold">{selectedService.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base md:text-lg font-bold text-foreground truncate">{selectedService.name}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {selectedMerchant.name}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-1 tabular-nums">
                    {selectedService.price > 0
                      ? `Rp${selectedService.price.toLocaleString('id-ID')}`
                      : 'Gratis'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-start gap-2"
              >
                <IconAlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive flex-1">{error}</p>
                <button onClick={() => setError('')} className="text-destructive/60 hover:text-destructive">
                  <IconX className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <Card className="rounded-2xl">
            <CardContent className="p-4 md:p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Data Diri</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <input type="hidden" {...register('serviceId')} />

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Nama Lengkap <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      {...register('customerName', {
                        required: 'Nama wajib diisi',
                        maxLength: { value: 100, message: 'Nama maksimal 100 karakter' },
                      })}
                      className="pl-9 rounded-xl"
                      placeholder="Masukkan nama Anda"
                      disabled={createQueue.isPending}
                    />
                  </div>
                  {errors.customerName && (
                    <p className="mt-1 text-xs text-destructive">{errors.customerName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Nomor Telepon</label>
                  <div className="relative">
                    <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      {...register('customerPhone', {
                        pattern: {
                          value: /^\+?[0-9]{10,15}$/,
                          message: 'Format nomor tidak valid (10-15 digit)',
                        },
                      })}
                      className="pl-9 rounded-xl"
                      placeholder="08xxxxxxxxxx"
                      disabled={createQueue.isPending}
                    />
                  </div>
                  {errors.customerPhone && (
                    <p className="mt-1 text-xs text-destructive">{errors.customerPhone.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={createQueue.isPending}
                  className="w-full rounded-xl h-11 text-sm font-semibold"
                >
                  {createQueue.isPending ? (
                    <><IconLoader2 className="w-4 h-4 animate-spin mr-2" /> Memproses...</>
                  ) : (
                    'Dapatkan Antrian'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
