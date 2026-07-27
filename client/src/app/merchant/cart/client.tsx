'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useCreateQueue } from '@/lib/hooks/useCreateQueue';
import { useCartStore } from '@/lib/store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import {
  IconUser, IconPhone, IconLoader2, IconArrowLeft, IconAlertCircle,
  IconX, IconTrash, IconWavesElectricity, IconShoppingCart, IconPlus, IconMinus,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useMerchant } from '@/lib/hooks/useMerchant';
import { imageUrl } from '@/lib/imageUrl';
import { saveActiveQueue } from '@/lib/activeQueue';

const CUSTOMER_STORAGE_KEY = 'antriin-customer';

function loadCustomerData(): { customerName: string; customerPhone: string } {
  if (typeof window === 'undefined') return { customerName: '', customerPhone: '' };
  try {
    const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (!raw) return { customerName: '', customerPhone: '' };
    return JSON.parse(raw);
  } catch {
    return { customerName: '', customerPhone: '' };
  }
}

function saveCustomerData(customerName: string, customerPhone: string) {
  try {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify({ customerName, customerPhone }));
  } catch { /* noop */ }
}

export function CartClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: merchant } = useMerchant(slug);
  const { items, note, addItem, updateQuantity, removeItem, clearCart, setNote, totalPrice } = useCartStore();
  const createQueue = useCreateQueue(slug);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<{ customerName: string; customerPhone: string }>({
    defaultValues: { customerName: '', customerPhone: '' },
  });

  const [customerName, customerPhone] = watch(['customerName', 'customerPhone']);

  useEffect(() => {
    const saved = loadCustomerData();
    if (saved.customerName) reset(saved);
  }, [reset]);

  const onSubmit = useCallback(async (data: { customerName: string; customerPhone: string }) => {
    if (items.length === 0) return;
    setError('');
    try {
      const serviceIds = items.flatMap((i) => Array(i.quantity).fill(i._id));
      const result = await createQueue.mutateAsync({
        serviceIds,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        note: note || undefined,
      });
      saveCustomerData(data.customerName, data.customerPhone);
      clearCart();
      saveActiveQueue(slug, { queueId: result.queue.id, number: result.queue.queueNumber, status: 'waiting' });
      router.push(`/queue/${result.queue.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.');
    }
  }, [items, note, createQueue, slug, clearCart, router]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border">
          <div className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
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
        <main className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4 py-20 text-center">
          <IconShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Keranjang Kosong</h2>
          <p className="text-sm text-muted-foreground mb-6">Pilih layanan dulu yuk</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-all"
          >
            Lihat Layanan
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="bg-card border-b border-border">
        <div className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
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

      <main className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div>
            <h1 className="text-lg font-bold text-foreground">Keranjang</h1>
            {merchant && <p className="text-sm text-muted-foreground">{merchant.name}</p>}
          </div>

          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3"
              >
                {item.image ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    <img src={imageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <IconShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                    {item.price > 0 && <span>Rp{item.price.toLocaleString('id-ID')}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center"
                    >
                      <IconMinus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                    <button
                      onClick={() => addItem({ _id: item._id, name: item.name, price: item.price, image: item.image || '', merchantId: '', description: '', isActive: true, createdAt: '', updatedAt: '' })}
                      className="w-7 h-7 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center"
                    >
                      <IconPlus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item._id)}
                      className="ml-1 p-1.5 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="bg-card border border-border rounded-2xl p-4">
            <label className="block text-sm font-medium text-foreground mb-2">Catatan (opsional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tulis catatan untuk merchant..."
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent h-20 resize-none text-sm"
            />
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            {items.map((item) => (
              <div key={item._id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                <span className="text-foreground">
                  {item.price > 0
                    ? `Rp${(item.price * item.quantity).toLocaleString('id-ID')}`
                    : 'Gratis'}
                </span>
              </div>
            ))}
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Harga</span>
                <span className="font-semibold text-foreground">
                  {totalPrice() > 0 ? `Rp${totalPrice().toLocaleString('id-ID')}` : 'Gratis'}
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
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2"
              >
                <IconAlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 dark:text-red-400 flex-1">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Data Diri</h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register('customerName', {
                    required: 'Nama wajib diisi',
                    maxLength: { value: 100, message: 'Nama maksimal 100 karakter' },
                  })}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                  placeholder="Masukkan nama Anda"
                  disabled={createQueue.isPending}
                />
              </div>
              {errors.customerName && (
                <p className="mt-1 text-xs text-red-500">{errors.customerName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nomor Telepon</label>
              <div className="relative">
                <IconPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register('customerPhone', {
                    pattern: {
                      value: /^\+?[0-9]{10,15}$/,
                      message: 'Format nomor tidak valid (10-15 digit)',
                    },
                  })}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                  placeholder="08xxxxxxxxxx"
                  disabled={createQueue.isPending}
                />
              </div>
              {errors.customerPhone && (
                <p className="mt-1 text-xs text-red-500">{errors.customerPhone.message}</p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={createQueue.isPending || !customerName?.trim()}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm text-sm"
            >
              {createQueue.isPending ? (
                <><IconLoader2 className="w-4 h-4 animate-spin" /> Memproses...</>
              ) : (
                'Dapatkan Antrian'
              )}
            </motion.button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
