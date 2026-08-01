'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { IconLoader2, IconBuildingStore, IconMapPin, IconPhone, IconQrcode, IconDownload, IconUpload, IconPlus, IconX, IconLink, IconPhoto } from '@tabler/icons-react';
import QRCode from 'qrcode';
import { adminApi } from '@/lib/api/admin';
import { imageUrl } from '@/lib/imageUrl';
import type { Merchant, SocialLink } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/ErrorAlert';

export default function SettingsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const merchantUrl = merchant
    ? process.env.NODE_ENV === 'development'
      ? `http://${merchant.slug}.localhost:3000`
      : `https://${merchant.slug}.tunggu.id`
    : '';

  useEffect(() => {
    if (!merchantUrl) return;
    QRCode.toDataURL(merchantUrl, { width: 300, margin: 2, color: { dark: '#1e293b' } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [merchantUrl]);

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `tunggu-${merchant?.slug || 'merchant'}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    description: '',
    image: '',
    banner: '',
    socialLinks: [] as SocialLink[],
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    adminApi.getMerchant()
      .then((m) => {
        setMerchant(m);
        setForm({
          name: m.name,
          address: m.address || '',
          phone: m.phone || '',
          description: m.description || '',
          image: m.image || '',
          banner: m.banner || '',
          socialLinks: m.socialLinks || [],
        });
      })
      .catch(() => setError('Gagal memuat data merchant'))
      .finally(() => setLoading(false));
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const updated = await adminApi.updateMerchant({
        name: form.name,
        address: form.address,
        phone: form.phone,
        description: form.description,
        image: form.image,
        banner: form.banner,
        socialLinks: form.socialLinks,
      });
      setMerchant(updated);
      setSuccess('Pengaturan berhasil disimpan');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  if (status !== 'authenticated') return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Pengaturan</h1>
            <p className="text-sm text-muted-foreground mt-1">Konfigurasi merchant</p>
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
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-2xl p-4">
                <CardContent className="p-0 space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !merchant ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <IconBuildingStore className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Merchant tidak ditemukan</h3>
              <p className="text-sm text-muted-foreground">Silakan setup merchant terlebih dahulu</p>
            </CardContent>
          </Card>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <Card className="border border-border rounded-2xl overflow-hidden">
              <CardContent className="p-5 space-y-5">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <IconBuildingStore className="w-4 h-4 text-primary" />
                  Informasi Merchant
                </h2>

                <div>
                  <Label>
                    Nama Merchant <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nama merchant"
                    required
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>Link Merchant</Label>
                  <div className="flex items-center border border-border rounded-xl bg-muted px-4 py-2.5 mt-1.5">
                    <span className="text-sm text-muted-foreground">/tunggu/</span>
                    <span className="text-sm text-foreground font-medium ml-1">{merchant.slug}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Slug tidak dapat diubah</p>
                </div>

                <div>
                  <Label>
                    <span className="flex items-center gap-1.5">
                      <IconMapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      Alamat
                    </span>
                  </Label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full mt-1.5 px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent h-20 resize-none text-sm"
                    placeholder="Alamat merchant (opsional)"
                  />
                </div>

                <div>
                  <Label>
                    <span className="flex items-center gap-1.5">
                      <IconPhone className="w-3.5 h-3.5 text-muted-foreground" />
                      No. Telepon
                    </span>
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+6281234567890 (opsional)"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>Deskripsi</Label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full mt-1.5 px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent h-20 resize-none text-sm"
                    placeholder="Deskripsi merchant (opsional)"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border rounded-2xl overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <IconUpload className="w-4 h-4 text-primary" />
                  Foto Merchant
                </h2>

                <div className="flex items-center gap-4">
                  {form.image ? (
                    <div className="w-20 h-20 rounded-full overflow-hidden border border-border flex-shrink-0">
                      <img src={imageUrl(form.image)} alt="Merchant" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <IconBuildingStore className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async () => {
                        const file = input.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const { url } = await adminApi.uploadImage(file);
                          setForm({ ...form, image: url });
                        } catch {
                          setError('Gagal upload gambar');
                        } finally {
                          setUploading(false);
                        }
                      };
                      input.click();
                    }}
                    disabled={uploading}
                    className="rounded-xl"
                  >
                    {uploading ? <IconLoader2 className="w-4 h-4 animate-spin mr-2" /> : <IconUpload className="w-4 h-4 mr-2" />}
                    {uploading ? 'Mengupload...' : 'Ganti Foto'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <IconPhoto className="w-4 h-4 text-primary" />
                  Banner Merchant
                </h2>

                <div className="flex items-center gap-4">
                  {form.banner ? (
                    <div className="w-full max-w-sm aspect-[3/1] rounded-xl overflow-hidden border border-border flex-shrink-0">
                      <img src={imageUrl(form.banner)} alt="Banner" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full max-w-sm aspect-[3/1] rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <IconPhoto className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async () => {
                        const file = input.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const { url } = await adminApi.uploadImage(file);
                          setForm({ ...form, banner: url });
                        } catch {
                          setError('Gagal upload banner');
                        } finally {
                          setUploading(false);
                        }
                      };
                      input.click();
                    }}
                    disabled={uploading}
                    className="rounded-xl"
                  >
                    {uploading ? <IconLoader2 className="w-4 h-4 animate-spin mr-2" /> : <IconUpload className="w-4 h-4 mr-2" />}
                    {uploading ? 'Mengupload...' : form.banner ? 'Ganti Banner' : 'Pilih Banner'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <IconQrcode className="w-4 h-4 text-primary" />
                  QR Code Merchant
                </h2>

                <p className="text-xs text-muted-foreground">
                  Scan QR code untuk masuk ke halaman merchant.
                </p>

                <div className="flex flex-col items-center gap-3">
                  <div className="bg-card border border-border rounded-xl p-3">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <IconLoader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{merchantUrl}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadQr}
                    disabled={!qrDataUrl}
                    className="rounded-xl"
                  >
                    <IconDownload className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <IconLink className="w-4 h-4 text-primary" />
                  Social Media <span className="text-xs font-normal text-muted-foreground">(maks. 3)</span>
                </h2>

                <div className="space-y-3">
                  {form.socialLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        value={link.platform}
                        onChange={(e) => {
                          const next = [...form.socialLinks];
                          next[i] = { ...next[i], platform: e.target.value as SocialLink['platform'] };
                          setForm({ ...form, socialLinks: next });
                        }}
                        className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring flex-shrink-0"
                      >
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                        <option value="youtube">YouTube</option>
                        <option value="facebook">Facebook</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="telegram">Telegram</option>
                        <option value="x">X (Twitter)</option>
                        <option value="threads">Threads</option>
                      </select>
                      <Input
                        value={link.url}
                        onChange={(e) => {
                          const next = [...form.socialLinks];
                          next[i] = { ...next[i], url: e.target.value };
                          setForm({ ...form, socialLinks: next });
                        }}
                        placeholder="https://instagram.com/username"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = form.socialLinks.filter((_, idx) => idx !== i);
                          setForm({ ...form, socialLinks: next });
                        }}
                        className="w-9 h-9 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center flex-shrink-0"
                      >
                        <IconX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {form.socialLinks.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const existingPlatforms = form.socialLinks.map(l => l.platform);
                      const avail = (['instagram', 'tiktok', 'youtube', 'facebook', 'whatsapp', 'telegram', 'x', 'threads'] as const).find(p => !existingPlatforms.includes(p));
                      setForm({ ...form, socialLinks: [...form.socialLinks, { platform: avail || 'instagram', url: '' }] });
                    }}
                    className="rounded-xl border-dashed w-full"
                  >
                    <IconPlus className="w-4 h-4 mr-2" />
                    Tambah Social Media
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.push('/dashboard')} className="rounded-xl">
                Batal
              </Button>
              <Button type="submit" disabled={saving} className="rounded-xl">
                {saving ? <><IconLoader2 className="w-4 h-4 animate-spin mr-2" /> Menyimpan...</> : 'Simpan'}
              </Button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}
