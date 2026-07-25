'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, ArrowRight, QrCode, Clock, Smartphone, Shield, Loader2 } from 'lucide-react';

const features = [
  { icon: QrCode, title: 'Scan QR', desc: 'Scan QR code merchant langsung masuk antrian' },
  { icon: Clock, title: 'Real-time', desc: 'Pantau antrian secara langsung dari HP' },
  { icon: Smartphone, title: 'Mobile Friendly', desc: 'Bisa diakses dari mana aja, kapan aja' },
  { icon: Shield, title: 'Aman', desc: 'Data terenkripsi dan privasi terjaga' },
];

export default function LandingPage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (slug.trim()) {
      setLoading(true);
      router.push(`/${slug.trim().toLowerCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Antriin</span>
          </div>
          <a
            href="http://localhost:3001/login"
            className="text-sm text-gray-600 hover:text-blue-500 transition-colors"
          >
            Admin
          </a>
        </div>
      </header>

      <main>
        <section className="max-w-4xl mx-auto px-4 pt-24 pb-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight"
          >
            Antre Online{' '}
            <span className="text-blue-500">Tanpa Ribet</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-gray-500 max-w-lg mx-auto"
          >
            Ambil nomor antrian dari rumah, pantau langsung dari HP. 
            Nggak perlu nunggu lama-lama di tempat.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="mt-10 max-w-md mx-auto"
          >
            <label htmlFor="merchant-search" className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Cari Merchant
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="merchant-search"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="contoh: mabduh"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={loading}
                />
              </div>
              <motion.button
                type="submit"
                disabled={!slug.trim() || loading}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-3 bg-blue-500 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-blue-600 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </motion.button>
            </div>
            <p className="mt-2 text-xs text-gray-400 text-left">
              Masukkan nama merchant untuk langsung ambil antrian
            </p>
          </motion.form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-xs text-gray-400"
          >
            Atau scan QR code dari merchant untuk masuk langsung
          </motion.p>
        </section>

        <section className="max-w-4xl mx-auto px-4 pb-24">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-gray-900 text-center mb-10"
          >
            Kenapa Antriin?
          </motion.h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-gray-100 rounded-2xl p-5 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <f.icon className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Antriin. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
