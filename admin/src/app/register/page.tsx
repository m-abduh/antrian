'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { adminApi } from '@/lib/api/admin';
import { setAccessToken } from '@/lib/auth-token';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const tokenClientRef = useRef<{ requestAccessToken: () => void } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.google?.accounts) {
      setGsiReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => setGsiReady(true);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  useEffect(() => {
    if (!gsiReady || !window.google?.accounts) return;
    const g = window.google.accounts.oauth2;
    tokenClientRef.current = g.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      scope: 'openid email profile',
      callback: async (response: { access_token?: string; error?: string }) => {
        if (response.error || !response.access_token) {
          setRegisterError('Gagal otentikasi dengan Google');
          setGoogleLoading(false);
          return;
        }
        try {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` },
          });
          const user = await userRes.json();
          if (!user.email) {
            setRegisterError('Email tidak ditemukan di akun Google');
            return;
          }
          const password = Math.random().toString(36).slice(-12) + 'Aa1!';
          const result = await adminApi.register({ name: user.name || user.email.split('@')[0], email: user.email, password });
          setAccessToken(result.token ?? null);
          router.push('/merchant/setup');
        } catch (err: unknown) {
          setRegisterError(err instanceof Error ? err.message : 'Gagal mendaftar dengan Google');
        } finally {
          setGoogleLoading(false);
        }
      },
    });
  }, [gsiReady, router]);

  const onSubmit = async (data: RegisterForm) => {
    setRegisterError('');
    try {
      const result = await adminApi.register(data);
      setAccessToken(result.token ?? null);
      router.push('/merchant/setup');
    } catch (err: unknown) {
      setRegisterError(err instanceof Error ? err.message : 'Gagal mendaftar');
    }
  };

  const handleGoogle = async () => {
    setRegisterError('');
    setGoogleLoading(true);
    if (!tokenClientRef.current) {
      setRegisterError('Google Identity Services belum siap');
      setGoogleLoading(false);
      return;
    }
    tokenClientRef.current.requestAccessToken();
  };

  return (
    <>
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">atau</span>
              </div>
            </div>

            <motion.button
              onClick={handleGoogle}
              disabled={googleLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Daftar dengan Google
                </>
              )}
            </motion.button>

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
    </>
  );
}
