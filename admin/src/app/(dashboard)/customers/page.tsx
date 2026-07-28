'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  IconUsers, IconSearch, IconX, IconLoader2, IconBrandWhatsapp,
  IconStar, IconStarFilled, IconCurrencyRupiah,
} from '@tabler/icons-react';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ErrorAlert } from '@/components/ErrorAlert';
import type { Customer } from '@/lib/types';

function formatRupiah(n: number) {
  return `Rp${n.toLocaleString('id-ID')}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function CustomersPage() {
  const router = useRouter();
  const { status } = useSession();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: customers, isLoading, error } = useQuery<Customer[]>({
    queryKey: ['admin', 'customers', debounced],
    queryFn: () => adminApi.getCustomers(debounced ? { search: debounced } : undefined),
    staleTime: 10_000,
  });

  if (status !== 'authenticated') return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Pelanggan</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Daftar pelanggan yang pernah antri
            </p>
          </div>
        </div>

        <Separator />

        <ErrorAlert message={error instanceof Error ? error.message : ''} onClose={() => {}} />

        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau nomor telepon..."
            className="pl-9 pr-10 rounded-xl"
          />
          {search && (
            <Button variant="ghost" size="icon" onClick={() => setSearch('')} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg">
              <IconX className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-2xl p-4">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !customers || customers.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <IconUsers className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Belum ada pelanggan</h3>
              <p className="text-sm text-muted-foreground">Pelanggan akan muncul setelah mereka mengambil antrian</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {customers.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card className="rounded-2xl border border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">{c.customerName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-foreground truncate">{c.customerName}</h4>
                          {c.customerPhone && (
                            <a
                              href={`https://wa.me/${c.customerPhone.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline"
                            >
                              <IconBrandWhatsapp className="w-3 h-3" />
                              {c.customerPhone}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 sm:gap-6 text-right">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Kunjungan</p>
                          <p className="text-sm font-bold text-foreground tabular-nums">{c.totalKunjungan}x</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Belanja</p>
                          <p className="text-sm font-bold text-foreground tabular-nums">{formatRupiah(c.totalBelanja)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rating</p>
                          <p className="text-sm font-bold text-foreground tabular-nums flex items-center justify-end gap-0.5">
                            {c.ratingRata ? (
                              <>
                                {c.ratingRata.toFixed(1)}
                                <IconStarFilled className="w-3.5 h-3.5 text-yellow-400" />
                              </>
                            ) : (
                              <span className="text-muted-foreground/50">-</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Terakhir</p>
                          <p className="text-xs font-medium text-foreground tabular-nums">{formatDate(c.terakhirAntri)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}