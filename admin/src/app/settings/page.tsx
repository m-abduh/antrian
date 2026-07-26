'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Store, MapPin, Phone, Key, Eye, EyeOff, ShieldCheck, QrCode, Download, Building2 } from 'lucide-react';
import QRCode from 'qrcode';
import { adminApi } from '@/lib/api/admin';
import type { Merchant } from '@/lib/types';

export default function SettingsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showServerKey, setShowServerKey] = useState(false);
  const [showClientKey, setShowClientKey] = useState(false);
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
    serverKey: '',
    clientKey: '',
    bankName: '',
    bankAccount: '',
    bankHolder: '',
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
          serverKey: m.midtrans?.serverKey || '',
          clientKey: m.midtrans?.clientKey || '',
          bankName: m.bank?.name || '',
          bankAccount: m.bank?.account || '',
          bankHolder: m.bank?.holder || '',
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
        bank: {
          name: form.bankName || undefined,
          account: form.bankAccount || undefined,
          holder: form.bankHolder || undefined,
        },
        midtrans: {
          serverKey: form.serverKey || undefined,
          clientKey: form.clientKey || undefined,
        },
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Pengaturan</h1>
            <p className="text-xs text-gray-500">Konfigurasi merchant & pembayaran</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !merchant ? (
          <div className="text-center py-20">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Merchant tidak ditemukan</h3>
            <p className="text-gray-500">Silakan setup merchant terlebih dahulu</p>
          </div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {error && (
              <div className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3 text-center">{error}</div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-green-600 bg-green-50 rounded-xl px-4 py-3 text-center"
              >
                {success}
              </motion.div>
            )}

            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-500" />
                Informasi Merchant
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Merchant <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nama merchant"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Merchant</label>
                <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 px-4 py-2.5">
                  <span className="text-sm text-gray-500">/antriin/</span>
                  <span className="text-sm text-gray-700 font-medium ml-1">{merchant.slug}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Slug tidak dapat diubah</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    Alamat
                  </span>
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                  placeholder="Alamat merchant (opsional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    No. Telepon
                  </span>
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+6281234567890 (opsional)"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-500" />
                QR Code Merchant
              </h2>

              <p className="text-xs text-gray-500">
                Scan QR code untuk masuk ke halaman merchant.
              </p>

              <div className="flex flex-col items-center gap-3">
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">{merchantUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={downloadQr}
                  disabled={!qrDataUrl}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download QR Code
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                Rekening Bank (untuk penarikan saldo)
              </h2>

              <p className="text-xs text-gray-500">
                Masukkan data rekening untuk menerima penarikan saldo.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Bank <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Bank</option>
                  <option value="BCA">BCA</option>
                  <option value="BNI">BNI</option>
                  <option value="BRI">BRI</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Danamon">Danamon</option>
                  <option value="Permata">Permata</option>
                  <option value="BSI">BSI</option>
                  <option value="SeaBank">SeaBank</option>
                  <option value="Bank Saqu">Bank Saqu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. Rekening <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.bankAccount}
                  onChange={(e) => setForm({ ...form, bankAccount: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Atas Nama <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.bankHolder}
                  onChange={(e) => setForm({ ...form, bankHolder: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="NAMA SESUAI REKENING"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                Midtrans Payment
              </h2>

              <p className="text-xs text-gray-500">
                Biarkan kosong jika masih menggunakan key global.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Server Key
                </label>
                <div className="relative">
                  <input
                    type={showServerKey ? 'text' : 'password'}
                    value={form.serverKey}
                    onChange={(e) => setForm({ ...form, serverKey: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pr-11 font-mono text-sm"
                    placeholder="SB-Mid-server-..."
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowServerKey(!showServerKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showServerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Key
                </label>
                <div className="relative">
                  <input
                    type={showClientKey ? 'text' : 'password'}
                    value={form.clientKey}
                    onChange={(e) => setForm({ ...form, clientKey: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pr-11 font-mono text-sm"
                    placeholder="SB-Mid-client-..."
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClientKey(!showClientKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showClientKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
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
