'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { IconLoader2, IconBuildingStore, IconArrowRight, IconWavesElectricity } from '@tabler/icons-react';
import { useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { setAccessToken } from '@/lib/auth-token';
import { ThemeToggle } from '@/components/ThemeToggle';

interface SetupForm {
  name: string;
  slug: string;
}

export default function MerchantSetupPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SetupForm>();

  const nameValue = watch('name');

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('name', val);
    setValue('slug', val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  const onSubmit = async (data: SetupForm) => {
    setError('');
    try {
      const result = await adminApi.setupMerchant(data);
      if (result.token) setAccessToken(result.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat merchant');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <IconWavesElectricity className="w-5 h-5 text-primary" />
            <span className="font-bold text-xl text-foreground">Antriin</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconBuildingStore className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Buat Merchant</h1>
              <p className="text-muted-foreground mt-1 text-sm">Siapkan toko atau bisnis kamu</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                  Nama Merchant
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name', { required: 'Nama merchant wajib diisi' })}
                  onChange={onNameChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm placeholder:text-muted-foreground/60"
                  placeholder="e.g. Barber Shop Mabduh"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-foreground mb-1.5">
                  Link Merchant
                </label>
                <div className="flex items-center border border-border rounded-xl focus-within:ring-2 focus-within:ring-ring overflow-hidden">
                  <span className="px-3 py-3 bg-muted text-sm text-muted-foreground border-r border-border whitespace-nowrap">
                    /antriin/
                  </span>
                  <input
                    id="slug"
                    type="text"
                    {...register('slug', {
                      required: 'Link wajib diisi',
                      pattern: { value: /^[a-z0-9-]+$/, message: 'Hanya huruf kecil, angka, dan strip' },
                    })}
                    className="flex-1 px-3 py-3 outline-none bg-background text-sm text-foreground"
                    placeholder="namamerchant"
                  />
                </div>
                {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500 bg-red-500/10 rounded-xl px-4 py-3 text-center"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <IconLoader2 className="w-5 h-5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    Lanjut ke Dashboard
                    <IconArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
