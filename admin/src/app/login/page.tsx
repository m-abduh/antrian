'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { IconLoader2, IconLogin, IconEye, IconEyeOff, IconWavesElectricity, IconBrandGoogle } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { adminApi } from '@/lib/api/admin';
import { setAccessToken } from '@/lib/auth-token';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { id_token?: string; access_token?: string; error?: string }) => void;
            error_callback?: () => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
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
      const si = await signIn('credentials', { token: result.token, redirect: false });
      if (si?.error) {
        setLoginError('Gagal sync session. Silakan coba lagi.');
        return;
      }
      router.push(result.admin?.merchantId ? '/dashboard' : '/merchant/setup');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Email atau password salah');
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setLoginError('');
    try {
      await new Promise<void>((resolve) => {
        const check = () => {
          if (window.google?.accounts?.oauth2) return resolve();
          setTimeout(check, 100);
        };
        check();
      });
      if (!window.google?.accounts?.oauth2) {
        setLoginError('Google Identity Services tidak tersedia');
        return;
      }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        scope: 'openid email profile',
        callback: async (response: any) => {
          try {
            const idToken = response?.id_token;
            const accessToken = response?.access_token;

            let expressRes;
            if (idToken) {
              expressRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: idToken }),
              });
            } else if (accessToken) {
              const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (!userRes.ok) {
                setLoginError('Gagal verifikasi akun Google');
                return;
              }
              const user = await userRes.json();
              expressRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/google-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken, email: user.email, name: user.name }),
              });
            } else {
              setLoginError('Gagal mendapatkan token Google');
              return;
            }

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
        },
        error_callback: () => {
          setLoginError('Gagal otentikasi Google');
          setGoogleLoading(false);
        },
      });
      client.requestAccessToken();
    } catch {
      setLoginError('Gagal memuat Google Login');
      setGoogleLoading(false);
    }
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
                  <IconLogin className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Masuk</CardTitle>
                <CardDescription>Dashboard admin Tunggu.id</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...register('email', { required: 'Email wajib diisi' })}
                      placeholder="admin@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        {...register('password', { required: 'Password wajib diisi' })}
                        placeholder="Masukkan password"
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
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
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
                    <IconLoader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <IconLogin className="w-5 h-5" />
                    Masuk
                  </>
                )}
              </motion.button>
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
                  Masuk dengan Google
                </>
              )}
            </motion.button>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Belum punya akun?{' '}
                <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/register')}>
                  Daftar
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
