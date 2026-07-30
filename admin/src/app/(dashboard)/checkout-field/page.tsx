'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  IconLoader2, IconUser, IconPhone, IconInfoCircle,
  IconPlus, IconTrash,
} from '@tabler/icons-react';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/ErrorAlert';

const DEFAULT_FIELDS = {
  customerName: { label: 'Nama Lengkap', placeholder: 'Masukkan nama Anda', required: true, icon: IconUser, desc: 'Field nama pelanggan' },
  customerPhone: { label: 'Nomor Telepon', placeholder: '08xxxxxxxxxx', required: false, icon: IconPhone, desc: 'Field nomor telepon / WhatsApp' },
} as const;

interface FieldItem {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
}

export default function CheckoutFieldPage() {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fields, setFields] = useState<FieldItem[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    adminApi.getMerchant()
      .then((m) => {
        if (m.customFieldsConfig) {
          setFields(m.customFieldsConfig);
        }
      })
      .catch(() => setError('Gagal memuat data'))
      .finally(() => setLoading(false));
  }, [status]);

  const isDefaultKey = (key: string) => key in DEFAULT_FIELDS;

  const addField = () => {
    const key = `custom_${Date.now()}`;
    setFields([...fields, { key, label: '', placeholder: '', required: false }]);
  };

  const addDefaultField = (defaultKey: string) => {
    const def = (DEFAULT_FIELDS as any)[defaultKey];
    setFields([...fields, { key: defaultKey, label: def.label, placeholder: def.placeholder, required: def.required }]);
  };

  const removeField = (key: string) => {
    setFields(fields.filter((f) => f.key !== key));
  };

  const updateField = (key: string, prop: string, value: string | boolean) => {
    setFields(fields.map((f) => f.key === key ? { ...f, [prop]: value } : f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await adminApi.updateMerchant({
        customFieldsConfig: fields.filter((f) => f.label.trim()),
      });
      setSuccess('Field checkout berhasil disimpan');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  if (status !== 'authenticated') return null;

  const activeDefaultKeys = Object.keys(DEFAULT_FIELDS).filter((k) => fields.some((f) => f.key === k));
  const missingDefaultKeys = Object.keys(DEFAULT_FIELDS).filter((k) => !fields.some((f) => f.key === k));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Field Checkout</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Atur field yang tampil di halaman pemesanan pelanggan
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
              <p className="font-medium text-foreground">Preview form pelanggan:</p>
              <div className="space-y-2 mt-2">
                {fields.filter((f) => f.label.trim()).map((f) => (
                  <div key={f.key} className="bg-background border border-border rounded-xl px-3 py-2">
                    <p className="text-[11px] text-muted-foreground mb-0.5">
                      {f.label}
                      {f.required && <span className="text-destructive"> *</span>}
                    </p>
                    <p className="text-sm text-muted-foreground/50">{f.placeholder || '(input teks)'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* All Fields */}
            {fields.map((field, i) => {
              const def = isDefaultKey(field.key) ? (DEFAULT_FIELDS as any)[field.key] : null;
              const Icon = def?.icon || null;

              return (
                <Card key={field.key} className="border border-border rounded-2xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-xs font-bold text-muted-foreground flex-shrink-0 mt-1">
                        {Icon ? <Icon className="w-4 h-4" /> : i + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        {def && (
                          <div>
                            <Label className="text-sm font-semibold capitalize">{def.label}</Label>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <IconInfoCircle className="w-3 h-3" />
                              {def.desc}
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <p className="text-[11px] text-muted-foreground mb-1">Label <span className="text-destructive">*</span></p>
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(field.key, 'label', e.target.value)}
                              placeholder={def?.label || 'Label field'}
                              className="rounded-xl"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground mb-1">Placeholder</p>
                            <Input
                              value={field.placeholder}
                              onChange={(e) => updateField(field.key, 'placeholder', e.target.value)}
                              placeholder={def?.placeholder || 'Placeholder'}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(field.key, 'required', e.target.checked)}
                                className="w-4 h-4 rounded border-border accent-primary"
                              />
                              <span className="text-sm text-foreground">Wajib diisi</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => removeField(field.key)}
                              className="pb-2.5 text-muted-foreground hover:text-red-500 transition-colors"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {missingDefaultKeys.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {missingDefaultKeys.map((k) => {
                  const def = (DEFAULT_FIELDS as any)[k];
                  return (
                    <Button
                      key={k}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addDefaultField(k)}
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
              <Button type="button" variant="outline" size="sm" onClick={addField} className="rounded-xl">
                <IconPlus className="w-3.5 h-3.5 mr-1.5" />
                Tambah Field Custom
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFields([
                      { key: 'customerName', label: 'Nama Lengkap', placeholder: 'Masukkan nama Anda', required: true },
                      { key: 'customerPhone', label: 'Nomor Telepon', placeholder: '08xxxxxxxxxx', required: false },
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
