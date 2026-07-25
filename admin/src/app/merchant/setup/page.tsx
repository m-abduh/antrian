'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Loader2, Store, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { setAccessToken } from '@/lib/auth-token';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-200/50 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Buat Merchant</h1>
            <p className="text-gray-500 mt-1">Siapkan toko atau bisnis kamu</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nama Merchant
              </label>
              <input
                id="name"
                type="text"
                {...register('name', { required: 'Nama merchant wajib diisi' })}
                onChange={onNameChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Barber Shop Mabduh"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1.5">
                Link Merchant
              </label>
              <div className="flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent overflow-hidden">
                <span className="px-3 py-3 bg-gray-50 text-sm text-gray-500 border-r border-gray-300 whitespace-nowrap">
                  /antriin/
                </span>
                <input
                  id="slug"
                  type="text"
                  {...register('slug', {
                    required: 'Link wajib diisi',
                    pattern: { value: /^[a-z0-9-]+$/, message: 'Hanya huruf kecil, angka, dan strip' },
                  })}
                  className="flex-1 px-3 py-3 outline-none text-sm"
                  placeholder="namamerchant"
                />
              </div>
              {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3 text-center"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  Lanjut ke Dashboard
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
