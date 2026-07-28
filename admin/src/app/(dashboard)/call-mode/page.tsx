'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  IconLoader2, IconVocabulary, IconClock, IconPhoneCall, IconUserCheck,
  IconCircleCheck, IconPlayerSkipForward, IconInfoCircle,
  IconPlus, IconTrash, IconChevronUp, IconChevronDown,
} from '@tabler/icons-react';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/ErrorAlert';

const DEFAULT_STATUSES: Record<string, { label: string; desc: string }> = {
  waiting: { label: 'Menunggu', desc: 'Antrian baru yang belum diproses (wajib)' },
  called: { label: 'Dipanggil', desc: 'Pelanggan sedang dipanggil' },
  serving: { label: 'Dilayani', desc: 'Pelanggan sedang dilayani' },
  done: { label: 'Selesai', desc: 'Antrian selesai (wajib)' },
  skipped: { label: 'Dilewati', desc: 'Antrian dilewati' },
};

const STATUS_ICONS: Record<string, any> = {
  waiting: IconClock,
  called: IconPhoneCall,
  serving: IconUserCheck,
  done: IconCircleCheck,
  skipped: IconPlayerSkipForward,
};

interface StatusItem {
  key: string;
  label: string;
}

export default function CallModePage() {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statuses, setStatuses] = useState<StatusItem[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    adminApi.getMerchant()
      .then((m) => {
        if (m.statusConfig) {
          setStatuses(m.statusConfig);
        }
      })
      .catch(() => setError('Gagal memuat data'))
      .finally(() => setLoading(false));
  }, [status]);

  const isLocked = (key: string) => key === 'waiting' || key === 'done';
  const isDefaultKey = (key: string) => key in DEFAULT_STATUSES;

  const addStatus = () => {
    const key = `custom_${Date.now()}`;
    setStatuses([...statuses, { key, label: '' }]);
  };

  const addDefaultStatus = (defaultKey: string) => {
    const def = DEFAULT_STATUSES[defaultKey];
    setStatuses([...statuses, { key: defaultKey, label: def.label }]);
  };

  const removeStatus = (key: string) => {
    if (isLocked(key)) return;
    setStatuses(statuses.filter((s) => s.key !== key));
  };

  const updateStatus = (key: string, prop: string, value: string) => {
    setStatuses(statuses.map((s) => s.key === key ? { ...s, [prop]: value } : s));
  };

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    const arr = [...statuses];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    setStatuses(arr);
  };

  const moveDown = (idx: number) => {
    if (idx >= statuses.length - 1) return;
    const arr = [...statuses];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    setStatuses(arr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await adminApi.updateMerchant({
        statusConfig: statuses.filter((s) => s.label.trim()),
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

  const missingDefaults = Object.keys(DEFAULT_STATUSES).filter(
    (k) => !isLocked(k) && !statuses.some((s) => s.key === k)
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Mode Panggilan</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Atur alur status antrian. Seret untuk urutkan, aktif/nonaktifkan sesuai kebutuhan
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
                {statuses.filter((s) => s.label.trim()).map((s, i) => (
                  <span key={s.key}>
                    {i > 0 && <span className="mx-1.5 text-muted-foreground/50">&rarr;</span>}
                    <span className="font-medium text-foreground">{s.label}</span>
                  </span>
                ))}
              </p>
            </div>

            {/* All Statuses */}
            {statuses.map((statusItem, idx) => {
              const locked = isLocked(statusItem.key);
              const def = isDefaultKey(statusItem.key) ? DEFAULT_STATUSES[statusItem.key] : null;
              const Icon = STATUS_ICONS[statusItem.key] || IconVocabulary;

              return (
                <Card key={statusItem.key} className="border border-border rounded-2xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${
                        locked ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Icon className={`w-5 h-5 ${locked ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-semibold flex items-center gap-2">
                              <span className="capitalize">{def?.label || statusItem.key}</span>
                              {locked && (
                                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                  Wajib
                                </span>
                              )}
                            </Label>
                            {def && (
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <IconInfoCircle className="w-3 h-3" />
                                {def.desc}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {!locked && idx > 1 && (
                              <button type="button" onClick={() => moveUp(idx)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                                <IconChevronUp className="w-4 h-4" />
                              </button>
                            )}
                            {!locked && idx < statuses.length - 2 && (
                              <button type="button" onClick={() => moveDown(idx)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                                <IconChevronDown className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Input
                              value={statusItem.label}
                              onChange={(e) => updateStatus(statusItem.key, 'label', e.target.value)}
                              placeholder={def?.label || 'Label status'}
                              className="rounded-xl"
                            />
                          </div>
                          {!locked && (
                            <button
                              type="button"
                              onClick={() => removeStatus(statusItem.key)}
                              className="text-muted-foreground hover:text-red-500 transition-colors"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {idx > 0 && (
                          <p className="text-[10px] text-muted-foreground/60">
                            Akan muncul setelah &quot;{statuses[idx - 1]?.label}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add default statuses that were removed */}
            {missingDefaults.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {missingDefaults.map((k) => {
                  const def = DEFAULT_STATUSES[k];
                  return (
                    <Button
                      key={k}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addDefaultStatus(k)}
                      className="rounded-xl border-dashed"
                    >
                      <IconPlus className="w-3.5 h-3.5 mr-1.5" />
                      Tambah {def.label}
                    </Button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={addStatus} className="rounded-xl">
                <IconPlus className="w-3.5 h-3.5 mr-1.5" />
                Tambah Status Custom
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStatuses([
                      { key: 'waiting', label: 'Menunggu' },
                      { key: 'called', label: 'Dipanggil' },
                      { key: 'serving', label: 'Dilayani' },
                      { key: 'done', label: 'Selesai' },
                      { key: 'skipped', label: 'Dilewati' },
                    ]);
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
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}
