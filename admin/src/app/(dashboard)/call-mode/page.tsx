'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  IconLoader2, IconVocabulary, IconClock, IconPhoneCall, IconUserCheck,
  IconCircleCheck, IconChevronUp, IconChevronDown,
  IconAlertTriangle, IconStar, IconBell, IconTrash,
} from '@tabler/icons-react';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/ErrorAlert';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';

const ALL_STATUSES: Record<string, { label: string; desc: string; icon: any; defaultMandiri: boolean; defaultNotify: boolean; defaultConfirm: boolean }> = {
  waiting: { label: 'Menunggu', desc: 'Antrian baru yang belum diproses (wajib)', icon: IconClock, defaultMandiri: false, defaultNotify: false, defaultConfirm: false },
  confirmed: { label: 'Dikonfirmasi', desc: 'Pesanan dikonfirmasi', icon: IconCircleCheck, defaultMandiri: false, defaultNotify: false, defaultConfirm: false },
  called: { label: 'Dipanggil', desc: 'Pelanggan sedang dipanggil', icon: IconPhoneCall, defaultMandiri: false, defaultNotify: true, defaultConfirm: false },
  serving: { label: 'Dilayani', desc: 'Pelanggan sedang dilayani', icon: IconUserCheck, defaultMandiri: false, defaultNotify: false, defaultConfirm: false },
  ready: { label: 'Siap', desc: 'Pesanan siap diambil', icon: IconStar, defaultMandiri: false, defaultNotify: false, defaultConfirm: false },
  done: { label: 'Selesai', desc: 'Antrian selesai (wajib)', icon: IconCircleCheck, defaultMandiri: false, defaultNotify: false, defaultConfirm: false },
  skipped: { label: 'Dilewati', desc: 'Antrian dilewati', icon: IconAlertTriangle, defaultMandiri: true, defaultNotify: false, defaultConfirm: false },
};

const LOCKED_KEYS = ['waiting', 'done'];

interface StatusConfigItem {
  key: string;
  label: string;
  mandiri: boolean;
  notify: boolean;
  confirm: boolean;
  enabled: boolean;
}

export default function CallModePage() {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statuses, setStatuses] = useState<StatusConfigItem[]>([]);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    adminApi.getMerchant()
      .then((m) => {
        const saved = m.statusConfig || [];
        const savedMap = new Map(saved.map((s: any) => [s.key, s]));
        const merged = Object.keys(ALL_STATUSES).map((key) => {
          const saved_item = savedMap.get(key);
          const def = ALL_STATUSES[key];
          return {
            key,
            label: saved_item?.label || def.label,
            mandiri: saved_item ? !!saved_item.mandiri : def.defaultMandiri,
            notify: saved_item ? !!saved_item.notify : def.defaultNotify,
            confirm: saved_item ? !!saved_item.confirm : def.defaultConfirm,
            enabled: !!saved_item,
          };
        });
        setStatuses(merged);
      })
      .catch(() => setError('Gagal memuat data'))
      .finally(() => setLoading(false));
  }, [status]);

  const disableStatus = (key: string) => {
    setStatuses(statuses.map((s) => s.key === key ? { ...s, enabled: false } : s));
    setConfirmKey(null);
  };

  const toggleEnabled = (key: string) => {
    setStatuses(statuses.map((s) => s.key === key ? { ...s, enabled: !s.enabled } : s));
  };

  const toggleMandiri = (key: string) => {
    setStatuses(statuses.map((s) => s.key === key ? { ...s, mandiri: !s.mandiri } : s));
  };

  const toggleNotify = (key: string) => {
    setStatuses(statuses.map((s) => s.key === key ? { ...s, notify: !s.notify } : s));
  };

  const toggleConfirm = (key: string) => {
    setStatuses(statuses.map((s) => s.key === key ? { ...s, confirm: !s.confirm } : s));
  };

  const updateLabel = (key: string, label: string) => {
    setStatuses(statuses.map((s) => s.key === key ? { ...s, label } : s));
  };

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    const arr = [...statuses];
    const prevKey = arr[idx - 1].key;
    if (LOCKED_KEYS.includes(prevKey) && LOCKED_KEYS.includes(arr[idx].key)) return;
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    setStatuses(arr);
  };

  const moveDown = (idx: number) => {
    if (idx >= statuses.length - 1) return;
    const arr = [...statuses];
    const nextKey = arr[idx + 1].key;
    if (LOCKED_KEYS.includes(arr[idx].key) && LOCKED_KEYS.includes(nextKey)) return;
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    setStatuses(arr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const enabled = statuses.filter((s) => s.enabled && s.label.trim());
      const linear = enabled.filter(s => !s.mandiri);
      if (linear.length < 2) {
        setError('Minimal 2 status linear harus aktif');
        setSaving(false);
        return;
      }
      if (linear[0].key !== 'waiting') {
        setError('Status linear pertama harus "Menunggu"');
        setSaving(false);
        return;
      }
      if (linear[linear.length - 1].key !== 'done') {
        setError('Status linear terakhir harus "Selesai"');
        setSaving(false);
        return;
      }
      await adminApi.updateMerchant({
        statusConfig: enabled.map((s) => ({ key: s.key, label: s.label.trim(), mandiri: s.mandiri, notify: s.notify, confirm: s.confirm })),
      });
      setSuccess('Mode panggilan berhasil disimpan');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  if (status !== 'authenticated') return null;

  const sorted = [...statuses];
  const enabledSt = sorted.filter(s => s.enabled);
  const linearSt = enabledSt.filter(s => !s.mandiri);
  const mandiriSt = enabledSt.filter(s => s.mandiri);
  const disabledSt = sorted.filter(s => !s.enabled);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Mode Panggilan</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Atur status antrian, tandai mandiri/linear, dan notifikasi
            </p>
          </div>
        </div>

        <Separator />

        <ErrorAlert message={error} onClose={() => setError('')} />

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-center"
          >
            {success}
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="rounded-2xl p-4">
                <CardContent className="p-0 space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Preview */}
            <div className="bg-muted/50 rounded-2xl p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Alur status saat ini:</p>
              <p>
                {linearSt.map((s, i) => (
                  <span key={s.key}>
                    {i > 0 && <span className="mx-1.5 text-muted-foreground/50">&rarr;</span>}
                    <span className="font-medium text-foreground">{s.label}</span>
                  </span>
                ))}
                {mandiriSt.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    · {mandiriSt.map(s => s.label).join(', ')}
                  </span>
                )}
              </p>
            </div>

            {/* Active Statuses */}
            <div className="space-y-2">
              {enabledSt.map((s, idx) => {
                const def = ALL_STATUSES[s.key];
                const Icon = def?.icon || IconVocabulary;
                const locked = LOCKED_KEYS.includes(s.key);

                return (
                  <Card key={s.key} className={`border rounded-2xl overflow-hidden ${
                    s.mandiri ? 'border-orange-200 dark:border-orange-800 bg-orange-500/[0.02]' : 'border-border'
                  }`}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          s.mandiri ? 'bg-orange-500/10' : locked ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <Icon className={`w-4 h-4 ${
                            s.mandiri ? 'text-orange-500' : locked ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{def.label}</span>
                            {locked && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Wajib</span>}
                            {s.mandiri && <span className="text-[10px] text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full">Mandiri</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{def.desc}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {!locked && !s.mandiri && (
                            <>
                              <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0 || LOCKED_KEYS.includes(enabledSt[idx - 1]?.key)} className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30">
                                <IconChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" onClick={() => moveDown(idx)} disabled={idx === enabledSt.length - 1 || LOCKED_KEYS.includes(enabledSt[idx + 1]?.key)} className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30">
                                <IconChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleNotify(s.key)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              s.notify
                                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            title={s.notify ? 'Notifikasi aktif' : 'Notifikasi mati'}
                          >
                            <IconBell className={`w-4 h-4 ${s.notify ? 'fill-primary/20' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleMandiri(s.key)}
                            disabled={locked}
                            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                              s.mandiri
                                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            } disabled:opacity-50`}
                          >
                            Mandiri
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleConfirm(s.key)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                              s.confirm
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Konfirmasi
                          </button>
                          {!locked && (
                            <button
                              type="button"
                              onClick={() => setConfirmKey(s.key)}
                              className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                              title="Nonaktifkan"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {!s.mandiri && s.key !== 'waiting' && s.key !== 'done' && (
                        <div className="mt-2 ml-12">
                          <Input
                            value={s.label}
                            onChange={(e) => updateLabel(s.key, e.target.value)}
                            className="rounded-xl text-sm h-8"
                            placeholder={def.label}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Disabled Statuses */}
            {disabledSt.length > 0 && (
              <div className="space-y-1 mt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nonaktif</p>
                <div className="flex flex-wrap gap-2">
                  {disabledSt.map((s) => {
                    const def = ALL_STATUSES[s.key];
                    const Icon = def?.icon || IconVocabulary;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => toggleEnabled(s.key)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {def.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const merged = Object.keys(ALL_STATUSES).map((key) => {
                    const def = ALL_STATUSES[key];
                    return {
                      key,
                      label: def.label,
                      mandiri: def.defaultMandiri,
                      notify: def.defaultNotify,
                      confirm: def.defaultConfirm,
                      enabled: true,
                    };
                  });
                  setStatuses(merged);
                }}
                className="rounded-xl"
              >
                Reset Default
              </Button>
              <Button type="submit" disabled={saving} className="rounded-xl">
                {saving ? (
                  <><IconLoader2 className="w-4 h-4 animate-spin mr-2" /> Menyimpan...</>
                ) : 'Simpan'}
              </Button>
            </div>
          </motion.form>
        )}
      </div>

      {/* Confirm disable dialog */}
      <Dialog open={!!confirmKey} onOpenChange={(open) => !open && setConfirmKey(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nonaktifkan status?</DialogTitle>
            <DialogDescription>
              Status <strong>{confirmKey ? ALL_STATUSES[confirmKey]?.label : ''}</strong> akan dinonaktifkan dan tidak muncul di alur antrian.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="rounded-xl">Batal</Button>
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => confirmKey && disableStatus(confirmKey)}
              className="rounded-xl"
            >
              Ya, Nonaktifkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}