'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { IconLoader2, IconUserPlus, IconEye, IconEyeOff, IconWavesElectricity, IconBrandGoogle } from '@tabler/icons-react';
import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { adminApi } from '@/lib/api/admin';
import { setAccessToken } from '@/lib/auth-token';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
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
          const si = await signIn('credentials', { token: result.token, redirect: false });
          if (si?.error) {
            setRegisterError('Gagal sync session. Silakan login manual.');
            return;
          }
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
      const si = await signIn('credentials', { token: result.token, redirect: false });
      if (si?.error) {
        setRegisterError('Gagal sync session. Silakan login manual.');
        return;
      }
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <IconWavesElectricity className="w-5 h-5 text-primary" />
            <span className="font-bold text-xl text-foreground">Tunggu.id</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/50 rounded-xl border border-border/50">
              <span className="text-[10px] font-medium text-muted-foreground/60">Android</span>
              <span className="text-[10px] text-muted-foreground/30">|</span>
              <span className="text-[10px] font-medium text-muted-foreground/60">iOS</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-medium">Dev</span>
            </div>
            <Button variant="ghost" className="rounded-xl" onClick={() => router.push('/login')}>
              Masuk
            </Button>
            <Button className="rounded-xl" onClick={() => router.push('/register')}>
              Daftar
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconUserPlus className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Daftar</CardTitle>
              <CardDescription>Bikin akun merchant baru</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Admin</Label>
                  <Input
                    id="name"
                    type="text"
                    {...register('name', { required: 'Nama wajib diisi' })}
                    placeholder="Nama kamu"
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email', { required: 'Email wajib diisi' })}
                    placeholder="admin@example.com"
                  />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
              </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('password', { required: 'Password wajib diisi', minLength: { value: 8, message: 'Minimal 8 karakter' } })}
                      placeholder="Minimal 8 karakter"
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                </div>

                {registerError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 bg-red-500/10 rounded-xl px-4 py-3 text-center"
                  >
                    {registerError}
                  </motion.p>
                )}

                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <IconLoader2 className="w-5 h-5 animate-spin" />
                        Mendaftar...
                      </>
                    ) : (
                      <>
                        <IconUserPlus className="w-5 h-5" />
                        Daftar
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

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
                <IconLoader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <IconBrandGoogle className="w-5 h-5" />
                  Daftar dengan Google
                </>
              )}
            </motion.button>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Sudah punya akun?{' '}
                <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/login')}>
                  Masuk
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}
