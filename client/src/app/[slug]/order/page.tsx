'use client';

import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useCreateQueue } from '@/lib/hooks/useCreateQueue';
import { useClientStore } from '@/lib/store/clientStore';
import { motion } from 'framer-motion';
import { CreditCard, User, Phone, Loader2, ArrowLeft, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { selectedMerchant, selectedService, setQueue } = useClientStore();
  const createQueue = useCreateQueue(slug);

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
      router.push(`/${slug}`);
    }
  }, [selectedMerchant, selectedService, router, slug]);

  const onSubmit = async (data: { customerName: string; customerPhone: string; serviceId: string }) => {
    try {
      const result = await createQueue.mutateAsync(data);
      setQueue(result.queue as never);
      if (result.paymentRequired && result.snapToken) {
        const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/v3/redirection';
        router.push(`${snapUrl}/${result.snapToken}`);
      } else {
        router.push(`/${slug}/queue/${result.queue.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!selectedMerchant || !selectedService) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-500">Mengalihkan...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <Link href={`/${slug}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Kembali</span>
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">{selectedService.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    {selectedService.price > 0
                      ? `Rp ${selectedService.price.toLocaleString('id-ID')}`
                      : 'Gratis'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedService.duration} menit
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <input type="hidden" {...register('serviceId')} />

              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="customerName"
                    {...register('customerName', {
                      required: 'Nama wajib diisi',
                      maxLength: { value: 100, message: 'Nama maksimal 100 karakter' },
                    })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan nama Anda"
                    disabled={createQueue.isPending}
                  />
                </div>
                {errors.customerName && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.customerName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nomor Telepon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="customerPhone"
                    {...register('customerPhone', {
                      pattern: {
                        value: /^\+?[0-9]{10,15}$/,
                        message: 'Format nomor tidak valid (10-15 digit)',
                      },
                    })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="08xxxxxxxxxx"
                    disabled={createQueue.isPending}
                  />
                </div>
                {errors.customerPhone && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.customerPhone.message}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-sm text-gray-600">
                  {selectedService.price > 0 ? (
                    <>
                      Total bayar: <strong className="text-gray-900">Rp {selectedService.price.toLocaleString('id-ID')}</strong>
                    </>
                  ) : (
                    'Layanan gratis - tidak perlu pembayaran'
                  )}
                </p>
              </div>

              <motion.button
                type="submit"
                disabled={createQueue.isPending}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 bg-blue-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createQueue.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : selectedService.price > 0 ? (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Bayar & Dapatkan Antrian
                  </>
                ) : (
                  'Dapatkan Antrian'
                )}
              </motion.button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500">
            Dengan melanjutkan, Anda setuju dengan{' '}
            <a href="#" className="text-blue-500 underline">Syarat & Ketentuan</a>
          </p>
        </motion.div>
      </main>
    </div>
  );
}