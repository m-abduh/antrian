'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, ArrowLeft, Wallet, TrendingUp, TrendingDown, Clock,
  CheckCircle2, XCircle, AlertCircle, Download, Banknote,
} from 'lucide-react';
import { useFinanceSummary, useFinanceBalance, useFinanceTransactions, useFinanceDisbursements, useRequestWithdraw } from '@/lib/hooks/useAdmin';
import { adminApi } from '@/lib/api/admin';
import type { Merchant } from '@/lib/types';

export default function FinancePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useFinanceSummary();
  const { data: balance } = useFinanceBalance();
  const { data: transactionsData } = useFinanceTransactions({ limit: 5 });
  const { data: disbursementsData } = useFinanceDisbursements({ limit: 5 });
  const requestWithdraw = useRequestWithdraw();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      adminApi.getMerchant()
        .then(setMerchant)
        .catch(() => {});
    }
  }, [status]);

  if (status !== 'authenticated') return null;

  const hasBank = merchant?.bank?.name && merchant?.bank?.account && merchant?.bank?.holder;

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount <= 0) return;
    try {
      await requestWithdraw.mutateAsync(amount);
      setWithdrawAmount('');
      setShowWithdraw(false);
    } catch {
      // error handled by react-query
    }
  };

  const formatRp = (n: number | null | undefined) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Keuangan</h1>
            <p className="text-xs text-gray-500">Saldo & Riwayat Penarikan</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {summaryLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : summaryError ? (
          <div className="text-center py-20 text-red-500">Gagal memuat data keuangan</div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Pendapatan', value: formatRp(summary.totalRevenue), color: 'bg-green-500', icon: TrendingUp },
                { label: 'Fee Midtrans', value: formatRp(summary.totalFees), color: 'bg-red-500', icon: TrendingDown },
                { label: 'Sudah Ditarik', value: formatRp(summary.totalDisbursed), color: 'bg-orange-500', icon: Banknote },
                { label: 'Saldo Tersedia', value: formatRp(summary.balance), color: 'bg-purple-500', icon: Wallet },
              ].map((stat) => (
                <div key={stat.label} className="bg-white shadow-sm rounded-2xl p-4">
                  <stat.icon className={`w-4 h-4 ${stat.color} text-white rounded-full p-0.5 mb-2`} />
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-green-500" />
                  Tarik Saldo
                </h2>
                <span className="text-xl font-bold text-green-600">{formatRp(balance?.balance || summary.balance)}</span>
                <span className="text-xs text-gray-400 ml-2">
                  (dari {formatRp(balance?.netRevenue || summary.netRevenue)} bersih)
                </span>
              </div>

              {!hasBank ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Lengkapi data bank terlebih dahulu</p>
                    <p className="mt-1">Isi rekening bank di halaman <button onClick={() => router.push('/settings')} className="text-blue-500 underline">Pengaturan</button> sebelum menarik saldo.</p>
                  </div>
                </div>
              ) : (
                <>
                  {showWithdraw ? (
                    <div className="space-y-3">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Jumlah penarikan"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        min={10000}
                        max={balance?.balance || summary.balance}
                      />
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Biaya transfer: <strong>Rp 5.550</strong> (dipotong dari saldo)</p>
                        <p>Rekening tujuan: <strong>{merchant?.bank?.name} - {merchant?.bank?.account}</strong> a.n. {merchant?.bank?.holder}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowWithdraw(false)}
                          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleWithdraw}
                          disabled={!withdrawAmount || parseInt(withdrawAmount) <= 0 || requestWithdraw.isPending}
                          className="flex-1 px-4 py-2.5 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                        >
                          {requestWithdraw.isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                          ) : (
                            'Tarik Saldo'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowWithdraw(true)}
                      disabled={(balance?.balance || summary.balance) <= 0}
                      className="w-full px-4 py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      Tarik Saldo
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Transaksi Terakhir</h2>
                {transactionsData?.transactions?.length ? (
                  <div className="space-y-3">
                    {transactionsData.transactions.slice(0, 5).map((t: any) => (
                      <div key={t._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{t.customerName}</p>
                          <p className="text-xs text-gray-500">{t.serviceId?.name || '-'}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatRp(t.serviceId?.price || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">Belum ada transaksi</p>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Riwayat Penarikan</h2>
                {disbursementsData?.disbursements?.length ? (
                  <div className="space-y-3">
                    {disbursementsData.disbursements.slice(0, 5).map((d) => (
                      <div key={d._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatRp(d.amount)}</p>
                          <p className="text-xs text-gray-500">
                            {d.status === 'success' ? 'Berhasil' : d.status === 'pending' ? 'Menunggu' : d.status === 'processing' ? 'Diproses' : 'Gagal'}
                            {' · '}
                            {new Date(d.requestedAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          d.status === 'success' ? 'bg-green-100 text-green-700' :
                          d.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {d.status === 'success' ? 'Sukses' : d.status === 'pending' ? 'Pending' : d.status === 'processing' ? 'Proses' : 'Gagal'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">Belum ada penarikan</p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
