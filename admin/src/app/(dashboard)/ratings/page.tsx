'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  IconStar, IconStarFilled, IconLoader2, IconUsers, IconMessageCircle,
} from '@tabler/icons-react';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ErrorAlert } from '@/components/ErrorAlert';
import type { Rating } from '@/lib/types';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        s <= value
          ? <IconStarFilled key={s} className="w-4 h-4 text-yellow-400" />
          : <IconStar key={s} className="w-4 h-4 text-muted-foreground/30" />
      ))}
    </span>
  );
}

export default function RatingsPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  const { data: ratings, isLoading, error } = useQuery<Rating[]>({
    queryKey: ['admin', 'ratings'],
    queryFn: () => adminApi.getRatings(),
    staleTime: 10_000,
  });

  if (status !== 'authenticated') return null;

  const avgRating = ratings && ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Rating</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Penilaian pelanggan terhadap layanan
            </p>
          </div>
          {avgRating && (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2">
              <span className="text-2xl font-bold text-foreground tabular-nums">{avgRating}</span>
              <IconStarFilled className="w-5 h-5 text-yellow-400" />
              <span className="text-xs text-muted-foreground">dari {ratings?.length} ulasan</span>
            </div>
          )}
        </div>

        <Separator />

        <ErrorAlert message={error instanceof Error ? error.message : ''} onClose={() => {}} />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : !ratings || ratings.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <IconStar className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Belum ada rating</h3>
              <p className="text-sm text-muted-foreground">Rating akan muncul setelah pelanggan memberikan penilaian</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {ratings.map((r, i) => (
              <Card key={r._id} className="rounded-2xl border-border">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <IconStarFilled className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-foreground">{r.customerName}</span>
                          <span className="text-muted-foreground/50 mx-2">·</span>
                          <span className="text-xs text-muted-foreground font-mono">{r.queueNumber}</span>
                        </div>
                        <StarDisplay value={r.rating} />
                      </div>
                      {r.services?.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {r.services.map((s: any) => s.name).join(', ')}
                        </p>
                      )}
                      {r.ratingComment && (
                        <div className="flex items-start gap-1.5 bg-muted/50 rounded-xl p-3">
                          <IconMessageCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-foreground/80">{r.ratingComment}</p>
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground/60">{formatDate(r.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}