'use client';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { IconLoader2, IconBuildingStore, IconArrowRight, IconWavesElectricity } from '@tabler/icons-react';
import { useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import { setAccessToken } from '@/lib/auth-token';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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
      if (result.token) {
        setAccessToken(result.token);
        const si = await signIn('credentials', { token: result.token, redirect: false });
        if (si?.error) {
          setError('Merchant berhasil dibuat, tapi gagal sync session. Silakan login ulang.');
          return;
        }
      }
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
            <span className="font-bold text-xl text-foreground">Tunggu.id</span>
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
          <Card>
            <CardHeader className="text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconBuildingStore className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Buat Merchant</CardTitle>
              <CardDescription>Siapkan toko atau bisnis kamu</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Merchant</Label>
                  <Input
                    id="name"
                    type="text"
                    {...register('name', { required: 'Nama merchant wajib diisi' })}
                    onChange={onNameChange}
                    placeholder="e.g. Barber Shop Mabduh"
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Link Merchant</Label>
                  <div className="flex items-center border border-border rounded-xl focus-within:ring-2 focus-within:ring-ring overflow-hidden">
                    <span className="px-3 py-3 bg-muted text-sm text-muted-foreground border-r border-border whitespace-nowrap">
                      https://
                    </span>
                    <Input
                      id="slug"
                      type="text"
                      {...register('slug', {
                        required: 'Link wajib diisi',
                        pattern: { value: /^[a-z0-9-]+$/, message: 'Hanya huruf kecil, angka, dan strip' },
                      })}
                      className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="namamerchant"
                    />
                    <span className="px-3 py-3 bg-muted text-sm text-muted-foreground border-l border-border whitespace-nowrap">
                      .tunggu.id
                    </span>
                  </div>
                  {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
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

                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
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
                  </Button>
                </motion.div>
              </form>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}
