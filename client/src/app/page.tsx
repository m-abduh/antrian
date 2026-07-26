'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { IconSearch, IconArrowRight, IconQrcode, IconClock, IconDeviceMobile, IconShield, IconLoader2 } from '@tabler/icons-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const features = [
  { icon: IconQrcode, title: 'Scan QR', desc: 'Scan QR code merchant langsung masuk antrian' },
  { icon: IconClock, title: 'Real-time', desc: 'Pantau antrian secara langsung dari HP' },
  { icon: IconDeviceMobile, title: 'Mobile Friendly', desc: 'Bisa diakses dari mana aja, kapan aja' },
  { icon: IconShield, title: 'Aman', desc: 'Data terenkripsi dan privasi terjaga' },
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <IconClock className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-foreground">Antriin</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />
            <a
              href="http://localhost:3001/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted"
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pt-16 md:pt-24 lg:pt-32 pb-16 md:pb-24 lg:pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <IconClock className="w-4 h-4" />
              Antre Online Tanpa Ribet
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight"
          >
            Antre Online{' '}
            <span className="text-primary">Tanpa Ribet</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 md:mt-5 text-base md:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed px-2"
          >
            Ambil nomor antrian dari rumah, pantau langsung dari HP.
            Nggak perlu nunggu lama-lama di tempat.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onSubmit={handleSubmit}
            className="mt-8 md:mt-10 max-w-md md:max-w-lg mx-auto"
          >
            <label htmlFor="merchant-search" className="block text-sm font-medium text-foreground mb-2 text-left">
              Cari Merchant
            </label>
            <div className="flex gap-2 md:gap-3">
              <div className="relative flex-1">
                <IconSearch className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                <input
                  id="merchant-search"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="contoh: mabduh"
                  className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-3.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm placeholder:text-muted-foreground/60"
                  disabled={loading}
                />
              </div>
              <motion.button
                type="submit"
                disabled={!slug.trim() || loading}
                whileTap={{ scale: 0.97 }}
                className="px-5 md:px-6 py-3 md:py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:opacity-90 transition-all shadow-sm"
              >
                {loading ? (
                  <IconLoader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <IconArrowRight className="w-4 h-4" />
                )}
              </motion.button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground text-left">
              Masukkan nama merchant untuk langsung ambil antrian
            </p>
          </motion.form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 md:mt-8 text-xs md:text-sm text-muted-foreground"
          >
            Atau scan QR code dari merchant untuk masuk langsung
          </motion.p>
        </section>

        <section className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pb-16 md:pb-24 lg:pb-32">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground text-center mb-8 md:mb-12"
          >
            Kenapa Antriin?
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-card border border-border rounded-2xl p-4 md:p-6 lg:p-8 text-center hover:shadow-lg hover:shadow-primary/5 transition-all"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <f.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm md:text-base text-foreground mb-1 md:mb-2">{f.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 text-center text-xs md:text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Antriin. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
