'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Loader2, UserPlus, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { setAccessToken } from '@/lib/auth-token';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  merchantName: string;
  merchantSlug: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    setRegisterError('');
    try {
      const result = await adminApi.register(data);
      setAccessToken(result.token ?? null);
      router.push('/dashboard');
    } catch (err: unknown) {
      setRegisterError(err instanceof Error ? err.message : 'Gagal mendaftar');
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
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Daftar</h1>
            <p className="text-gray-500 mt-1">Bikin akun merchant baru</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nama Admin
              </label>
              <input
                id="name"
                type="text"
                {...register('name', { required: 'Nama wajib diisi' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nama kamu"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email', { required: 'Email wajib diisi' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password', { required: 'Password wajib diisi', minLength: { value: 8, message: 'Minimal 8 karakter' } })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-11"
                  placeholder="Minimal 8 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <hr className="border-gray-200" />

            <div>
              <label htmlFor="merchantName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nama Merchant
              </label>
              <input
                id="merchantName"
                type="text"
                {...register('merchantName', { required: 'Nama merchant wajib diisi' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Barber Shop Mabduh"
              />
              {errors.merchantName && <p className="mt-1 text-sm text-red-500">{errors.merchantName.message}</p>}
            </div>

            <div>
              <label htmlFor="merchantSlug" className="block text-sm font-medium text-gray-700 mb-1.5">
                Link Merchant
              </label>
              <div className="flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent overflow-hidden">
                <span className="px-3 py-3 bg-gray-50 text-sm text-gray-500 border-r border-gray-300 whitespace-nowrap">
                  /antriin/
                </span>
                <input
                  id="merchantSlug"
                  type="text"
                  {...register('merchantSlug', {
                    required: 'Link wajib diisi',
                    pattern: { value: /^[a-z0-9-]+$/, message: 'Hanya huruf kecil, angka, dan strip' },
                  })}
                  className="flex-1 px-3 py-3 outline-none text-sm"
                  placeholder="namamerchant"
                />
              </div>
              {errors.merchantSlug && <p className="mt-1 text-sm text-red-500">{errors.merchantSlug.message}</p>}
            </div>

            {registerError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3 text-center"
              >
                {registerError}
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
                  Mendaftar...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Daftar
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Sudah punya akun?{' '}
              <button onClick={() => router.push('/login')} className="text-blue-500 font-medium hover:underline">
                Masuk
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
