'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CreditCard, Clock, MapPin, Phone, CheckCircle, ArrowRight } from 'lucide-react';
import { useMerchant, useServices } from '@/lib/hooks/useMerchant';
import { useClientStore } from '@/lib/store/clientStore';

export default function MerchantPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: merchant, isLoading: merchantLoading } = useMerchant(slug);
  const { data: services, isLoading: servicesLoading } = useServices(slug);
  const { setMerchant, setService } = useClientStore();

  if (merchantLoading || servicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Merchant tidak ditemukan</h1>
          <p className="text-gray-500">QR Code mungkin tidak valid atau merchant tidak aktif</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Antriin</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-8 h-8 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">{merchant.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{merchant.slug}</p>
                {merchant.address && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{merchant.address}</span>
                  </div>
                )}
                {merchant.phone && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{merchant.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Layanan Tersedia</h3>
            {services && services.length > 0 ? (
              <div className="space-y-3">
                {services.map((service, index) => (
                  <Link key={service._id} href={`/${slug}/order`}>
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setMerchant(merchant);
                        setService(service);
                      }}
                      className="w-full text-left bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <CreditCard className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{service.name}</h4>
                        {service.description && (
                          <p className="text-sm text-gray-500 truncate mt-1">{service.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {service.duration} min
                          </span>
                          <span className="flex items-center gap-1 font-medium text-gray-900">
                            {service.price > 0
                              ? `Rp ${service.price.toLocaleString('id-ID')}`
                              : 'Gratis'}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                    </motion.button>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Layanan</h4>
                <p className="text-gray-500">Silakan hubungi admin untuk menambah layanan</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Cara Pakai
            </h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center gap-2">Pilih layanan di atas</li>
              <li className="flex items-center gap-2">Isi nama & nomor telepon</li>
              <li className="flex items-center gap-2">Bayar via QRIS (jika berbayar)</li>
              <li className="flex items-center gap-2">Dapatkan nomor antrian</li>
              <li className="flex items-center gap-2">Pantau posisi antrian real-time</li>
            </ol>
          </div>
        </motion.div>
      </main>
    </div>
  );
}