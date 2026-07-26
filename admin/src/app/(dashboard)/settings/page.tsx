'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { IconLoader2, IconBuildingStore, IconMapPin, IconPhone, IconQrcode, IconDownload, IconUpload, IconWavesElectricity, IconPlus, IconX, IconLink, IconPhoto } from '@tabler/icons-react';
import QRCode from 'qrcode';
import { adminApi } from '@/lib/api/admin';
import { imageUrl } from '@/lib/imageUrl';
import type { Merchant, SocialLink } from '@/lib/types';

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
    ? `${window.location.protocol}//${window.location.hostname}:3000/${merchant.slug}`
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
    link.download = `antriin-${merchant?.slug || 'merchant'}.png`;
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
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 pl-10 lg:pl-0">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:opacity-90 transition-all shadow-sm"
              >
                <IconBuildingStore className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-foreground">Pengaturan</h1>
                <p className="text-xs text-muted-foreground">Konfigurasi merchant</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !merchant ? (
          <div className="text-center py-20">
            <IconBuildingStore className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Merchant tidak ditemukan</h3>
            <p className="text-muted-foreground">Silakan setup merchant terlebih dahulu</p>
          </div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6 max-w-lg"
          >
            {error && (
              <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center">{error}</div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-center"
              >
                {success}
              </motion.div>
            )}

            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <IconBuildingStore className="w-4 h-4 text-primary" />
                Informasi Merchant
              </h2>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nama Merchant <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                  placeholder="Nama merchant"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Link Merchant</label>
                <div className="flex items-center border border-border rounded-xl bg-muted px-4 py-2.5">
                  <span className="text-sm text-muted-foreground">/antriin/</span>
                  <span className="text-sm text-foreground font-medium ml-1">{merchant.slug}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Slug tidak dapat diubah</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <IconMapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    Alamat
                  </span>
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent h-20 resize-none text-sm"
                  placeholder="Alamat merchant (opsional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <IconPhone className="w-3.5 h-3.5 text-muted-foreground" />
                    No. Telepon
                  </span>
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                  placeholder="+6281234567890 (opsional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent h-20 resize-none text-sm"
                  placeholder="Deskripsi merchant (opsional)"
                />
              </div>
              </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
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
                <button
                  type="button"
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
                  className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors text-sm"
                >
                  {uploading ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconUpload className="w-4 h-4" />}
                  {uploading ? 'Mengupload...' : 'Ganti Foto'}
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
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
                <button
                  type="button"
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
                  className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors text-sm"
                >
                  {uploading ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconUpload className="w-4 h-4" />}
                  {uploading ? 'Mengupload...' : form.banner ? 'Ganti Banner' : 'IconUpload Banner'}
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
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
                <button
                  type="button"
                  onClick={downloadQr}
                  disabled={!qrDataUrl}
                  className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  <IconDownload className="w-4 h-4" />
                  IconDownload QR Code
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
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
                    </select>
                    <input
                      value={link.url}
                      onChange={(e) => {
                        const next = [...form.socialLinks];
                        next[i] = { ...next[i], url: e.target.value };
                        setForm({ ...form, socialLinks: next });
                      }}
                      className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                <button
                  type="button"
                  onClick={() => {
                    const existingPlatforms = form.socialLinks.map(l => l.platform);
                    const avail = (['instagram', 'tiktok', 'youtube', 'facebook'] as const).find(p => !existingPlatforms.includes(p));
                    setForm({ ...form, socialLinks: [...form.socialLinks, { platform: avail || 'instagram', url: '' }] });
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 rounded-xl text-sm transition-colors"
                >
                  <IconPlus className="w-4 h-4" />
                  Tambah Social Media
                </button>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2.5 border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm"
              >
                {saving ? (
                  <><IconLoader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </motion.form>
        )}
      </main>
    </div>
  );
}
