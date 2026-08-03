'use client';

import { useState } from 'react';
import { IconWavesElectricity, IconSearch, IconArrowRight, IconQrcode, IconLoader2, IconBrandGooglePlay, IconBrandApple } from '@tabler/icons-react';

export default function Hero() {
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (slug.trim()) {
      setLoading(true);
      const s = slug.trim().toLowerCase();
      if (window.location.hostname === 'localhost') {
        window.location.href = `http://${s}.localhost:3000`;
      } else {
        window.location.href = `https://${s}.tunggu.id`;
      }
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-61px)] flex flex-col items-center justify-center px-4 md:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-teal-500/[0.04] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-500/[0.04] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-500 text-sm font-medium mb-6">
          <IconWavesElectricity className="w-4 h-4" />
          Antre Online Tanpa Ribet
        </span>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground leading-[1.05] tracking-tight text-center">
          Antre <span className="text-teal-500">Tanpa Ribet</span> dari <span className="text-orange-500 text-6xl sm:text-7xl md:text-8xl lg:text-9xl">Manapun.</span>
        </h1>

        <p className="mt-4 md:mt-6 text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-center px-2">
          Tanpa aplikasi, tanpa ribet — pelanggan cukup scan QR atau buka link, langsung dapat nomor antrian dan pantau kapan giliran tiba.
        </p>

        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
          <span className="w-4 h-4 flex items-center justify-center">✓</span>
          100% Gratis untuk Akses Awal — Tanpa Dipungut Biaya
        </p>

        <form onSubmit={handleSubmit} className="mt-10 max-w-lg w-full">
          <label htmlFor="hero-search" className="block text-sm font-medium text-foreground mb-2 text-left">
            Cari Merchant
          </label>
          <div className="flex gap-2 md:gap-3">
            <div className="relative flex-1">
              <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="hero-search"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="contoh: mabduh"
                className="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-sm placeholder:text-muted-foreground/60 text-foreground"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={!slug.trim() || loading}
              className="px-6 py-3.5 bg-teal-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-teal-600 transition-colors shadow-sm shadow-teal-500/20"
            >
              {loading ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconArrowRight className="w-4 h-4" />}
              <span className="hidden sm:inline">Cari</span>
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground text-left">
            Masukkan nama merchant untuk langsung ambil antrian
          </p>
        </form>

        <p className="mt-6 flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
          <IconQrcode className="w-4 h-4" />
          Atau scan QR code dari merchant untuk masuk langsung
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-card border border-border">
            <IconBrandGooglePlay className="w-5 h-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-[10px] text-muted-foreground leading-tight">Get it on</p>
              <p className="text-xs font-semibold text-foreground leading-tight">Google Play</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-card border border-border">
            <IconBrandApple className="w-5 h-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-[10px] text-muted-foreground leading-tight">Download on</p>
              <p className="text-xs font-semibold text-foreground leading-tight">App Store</p>
            </div>
          </div>
          <span className="text-[10px] px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-400 font-medium">
            Tahap Pengembangan
          </span>
        </div>
      </div>
    </section>
  );
}