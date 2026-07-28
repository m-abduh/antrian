'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  IconUsers, IconSearch, IconX, IconLoader2, IconBrandWhatsapp,
  IconStarFilled,
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
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
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground whitespace-nowrap">Nama</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground whitespace-nowrap">Telepon</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground whitespace-nowrap">Kunjungan</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground whitespace-nowrap">Total Belanja</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground whitespace-nowrap">Rating</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground whitespace-nowrap">Terakhir Antri</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground">{c.customerName}</span>
                    </td>
                    <td className="py-3 px-4">
                      {c.customerPhone ? (
                        <a
                          href={`https://wa.me/${c.customerPhone.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 hover:underline"
                        >
                          <IconBrandWhatsapp className="w-3.5 h-3.5" />
                          {c.customerPhone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium text-foreground">{c.totalKunjungan}x</td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium text-foreground">{formatRupiah(c.totalBelanja)}</td>
                    <td className="py-3 px-4 text-right">
                      {c.ratingRata ? (
                        <span className="inline-flex items-center gap-1 tabular-nums font-medium text-foreground">
                          {c.ratingRata.toFixed(1)}
                          <IconStarFilled className="w-3.5 h-3.5 text-yellow-400" />
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-muted-foreground text-xs">{formatDate(c.terakhirAntri)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}