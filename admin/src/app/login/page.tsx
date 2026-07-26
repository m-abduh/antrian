'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Loader2, LogIn, Eye, EyeOff, Waves } from 'lucide-react';
import { useState, useEffect } from 'react';
import { signIn, getCsrfToken } from 'next-auth/react';
import { adminApi } from '@/lib/api/admin';
import { setAccessToken } from '@/lib/auth-token';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (window.opener && window.location.search.includes('google_callback=1')) {
      window.close();
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; password: string }>();

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoginError('');
    try {
      const result = await adminApi.login(data.email, data.password);
      setAccessToken(result.token ?? null);
      signIn('credentials', { email: data.email, password: data.password, redirect: false }).catch(() => {});
      router.push(result.admin?.merchantId ? '/dashboard' : '/merchant/setup');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Email atau password salah');
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setLoginError('');
    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch('/api/auth/signin/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          csrfToken: csrfToken ?? '',
          callbackUrl: window.location.origin + '/login?google_callback=1',
          json: 'true',
        }),
      });
      const data = await res.json();
      if (!data.url) {
        setLoginError('Gagal mendapatkan URL Google');
        return;
      }
      const popup = window.open(data.url, 'google-auth', 'width=500,height=600');
      if (!popup) {
        setLoginError('Popup diblokir. Izinkan popup untuk Google login.');
        setGoogleLoading(false);
        return;
      }
      await new Promise<void>((resolve) => {
        const timer = setInterval(() => {
          if (popup.closed) { clearInterval(timer); resolve(); }
        }, 500);
      });
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      const userEmail = session?.user?.email;
      if (!userEmail) {
        setLoginError('Gagal mendapatkan email dari Google');
        return;
      }
      const expressRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/google-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      const expressData = await expressRes.json();
      if (!expressData.success) {
        setLoginError(expressData.error || 'Gagal login');
        return;
      }
      setAccessToken(expressData.data.token);
      const si = await signIn('credentials', { token: expressData.data.token, redirect: false });
      if (si?.error) {
        setLoginError('Gagal sync session');
        return;
      }
      router.push(expressData.data.admin.merchantId ? '/dashboard' : '/merchant/setup');
    } catch {
      setLoginError('Gagal login dengan Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Waves className="w-5 h-5 text-primary" />
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
                <LogIn className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Masuk</h1>
              <p className="text-muted-foreground mt-1 text-sm">Dashboard admin Antriin</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email', { required: 'Email wajib diisi' })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm placeholder:text-muted-foreground/60"
                  placeholder="admin@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password', { required: 'Password wajib diisi' })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent pr-11 text-sm placeholder:text-muted-foreground/60"
                    placeholder="Masukkan password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {loginError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500 bg-red-500/10 rounded-xl px-4 py-3 text-center"
                >
                  {loginError}
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
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Masuk
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Belum punya akun?{' '}
                <button onClick={() => router.push('/register')} className="text-primary font-medium hover:underline">
                  Daftar
                </button>
              </p>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-card text-muted-foreground">atau</span>
              </div>
            </div>

            <motion.button
              onClick={handleGoogle}
              disabled={googleLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 border border-border text-foreground font-semibold rounded-xl hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Masuk dengan Google
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
