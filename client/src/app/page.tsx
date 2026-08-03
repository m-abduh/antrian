'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconSearch, IconQrcode, IconClock, IconDeviceMobile, IconShield,
  IconBuildingStore, IconChartBar, IconBell, IconUsers,
  IconCheck, IconChevronDown, IconStar, IconStarFilled, IconWavesElectricity,
  IconLayoutDashboard, IconReportAnalytics, IconCircleCheck, IconPlayerSkipForward,
  IconHelp,
} from '@tabler/icons-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import Hero from '@/components/Hero';

const features = [
  { icon: IconQrcode, title: 'Scan QR / Link', desc: 'Pelanggan bisa masuk lewat QR code atau link merchant, tanpa install apps' },
  { icon: IconClock, title: 'Antrian Real-time', desc: 'Pantau nomor antrian langsung dari HP, tau kira-kira kapan giliran tiba' },
  { icon: IconDeviceMobile, title: 'Mobile Friendly', desc: 'Bisa diakses dari mana aja via HP, ga perlu duduk nunggu di tempat' },
  { icon: IconBuildingStore, title: 'Multi Layanan', desc: 'Satu merchant bisa punya banyak layanan dengan grup dan harga berbeda' },
  { icon: IconLayoutDashboard, title: 'Dashboard Merchant', desc: 'Admin panel lengkap buat ngatur antrian, layanan, dan grup' },
  { icon: IconReportAnalytics, title: 'Laporan Otomatis', desc: 'Statistik harian, jam sibuk, breakdown per layanan — otomatis' },
  { icon: IconBell, title: 'Notifikasi Panggilan', desc: 'Status antrian berubah real-time, panggil pelanggan langsung dari dashboard' },
  { icon: IconShield, title: 'Aman & Privasi', desc: 'Data pelanggan terenkripsi, privasi tetap terjaga' },
];

const stepsCustomer = [
  { icon: IconSearch, step: 'Cari Merchant', desc: 'Masukkan nama merchant atau scan QR code untuk mulai' },
  { icon: IconQrcode, step: 'Pilih & Ambil', desc: 'Pilih layanan yang diinginkan, langsung dapat nomor antrian' },
  { icon: IconClock, step: 'Pantau & Datang', desc: 'Pantau antrian real-time, datang pas giliran tiba' },
];

const stepsMerchant = [
  { icon: IconBuildingStore, step: 'Buat Merchant', desc: 'Daftar dan setup nama, alamat, dan profil merchant' },
  { icon: IconChartBar, step: 'Atur Layanan', desc: 'Tambah layanan, grup, dan harga sesuai kebutuhan' },
  { icon: IconLayoutDashboard, step: 'Kelola Antrian', desc: 'Panggil, layani, atau lewati antrian dari dashboard' },
  { icon: IconReportAnalytics, step: 'Lihat Laporan', desc: 'Pantau statistik harian, peak hour, dan kinerja' },
];

const testimonials = [
  { name: 'Sarah Wijaya', role: 'Pemilik Salon', text: 'Pelanggan ga perlu nunggu lama-lama di salon. Mereka bisa pantau antrian dari rumah.', rating: 5 },
  { name: 'Bambang Santoso', role: 'Pemilik Bengkel', text: 'Dashboard-nya simple, tinggal klik panggil aja. Pelanggan juga pada suka karena praktis.', rating: 5 },
  { name: 'Dewi Lestari', role: 'Pemilik Klinik', text: 'Fitur laporan harian bantu banget buat evaluasi. Jadi tau jam sibuk dan layanan favorit.', rating: 5 },
];

const faqs = [
  { q: 'Apakah Tunggu.id gratis?', a: 'Ya, Tunggu.id gratis untuk merchant. Kami menyediakan fitur dasar tanpa biaya berlangganan. Untuk fitur premium akan kami informasikan lebih lanjut.' },
  { q: 'Bagaimana cara daftar jadi merchant?', a: 'Klik tombol "Daftar Merchant", isi data diri, buat merchant dengan nama dan slug, lalu siap digunakan. Total proses kurang dari 5 menit.' },
  { q: 'Apakah pelanggan perlu install apps?', a: 'Tidak perlu. Pelanggan cukup buka link merchant atau scan QR code lewat browser HP. Semua berjalan di web.' },
  { q: 'Bisa dipake untuk banyak layanan?', a: 'Bisa. Satu merchant bisa punya banyak layanan, dikelompokkan dalam grup. Contoh: potong rambut, creambath, coloring — dalam grup "Hair Treatment".' },
  { q: 'Apakah data aman?', a: 'Ya. Semua data terenkripsi dan disimpan dengan aman. Kami menggunakan HTTPS dan protokol keamanan standar industri.' },
  { q: 'Bagaimana cara pelanggan dapat notifikasi?', a: 'Pelanggan bisa pantau antrian langsung di halaman merchant. Status antrian berubah real-time tanpa perlu reload.' },
];

const sectionBadge =
  'inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-500 text-sm font-medium mb-4';

const blobTeal =
  'absolute top-10 left-0 -translate-x-1/2 w-[400px] h-[400px] bg-teal-500/[0.05] rounded-full pointer-events-none';
const blobOrange =
  'absolute bottom-0 right-0 translate-x-1/3 w-[400px] h-[400px] bg-orange-500/[0.05] rounded-full pointer-events-none';

function SectionHeading({ badge, icon: Icon, title, subtitle }: {
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="text-center mb-8 md:mb-12"
    >
      <span className={sectionBadge}>
        <Icon className="w-4 h-4" />
        {badge}
      </span>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-[1.1]">
        {title}
      </h2>
      <p className="mt-3 text-muted-foreground max-w-md mx-auto">{subtitle}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-500/[0.05] via-background to-background dark:from-teal-500/[0.08] dark:via-background dark:to-background">
      {/* ─── NAVBAR ─── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <img src="/logo/Tunggu.id.png" alt="Tunggu.id" className="h-5 md:h-6 w-auto" />
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={() => scrollTo('how-customer')} className="hover:text-foreground transition-colors">Cara Kerja</button>
            <button onClick={() => scrollTo('features')} className="hover:text-foreground transition-colors">Fitur</button>
            <button onClick={() => scrollTo('faq')} className="hover:text-foreground transition-colors">FAQ</button>
            <a href={`${adminUrl}/login`} className="hover:text-foreground transition-colors">Masuk</a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href={`${adminUrl}/register`}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white text-sm font-semibold rounded-xl hover:bg-teal-600 transition-all shadow-sm shadow-teal-500/20"
            >
              Daftar Merchant
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* ─── HERO ─── */}
        <Hero />

        {/* ─── STATS ─── */}
        <section className="relative max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pb-16 md:pb-24">
          <div className={blobTeal} aria-hidden="true" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { value: '500+', label: 'Merchant Aktif', icon: IconBuildingStore },
              { value: '50K+', label: 'Antrian Diproses', icon: IconCircleCheck },
              { value: '30+', label: 'Kota Tersebar', icon: IconUsers },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-5 md:p-7 text-center hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-0.5 transition-all"
              >
                <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <s.icon className="w-5 h-5 text-teal-500" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── CARA KERJA (CUSTOMER) ─── */}
        <section id="how-customer" className="relative max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pb-16 md:pb-24">
          <div className={blobOrange} aria-hidden="true" />
          <SectionHeading
            badge="Cara Kerja"
            icon={IconUsers}
            title={<>Untuk <span className="text-teal-500">Pelanggan</span></>}
            subtitle="Gampang, tinggal 3 langkah aja"
          />

          <div className="grid md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {stepsCustomer.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative bg-card border border-border rounded-2xl p-5 md:p-7 hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="w-8 h-8 rounded-full bg-teal-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm shadow-teal-500/30">
                    {i + 1}
                  </span>
                  <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-teal-500" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{s.step}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── CARA KERJA (MERCHANT) ─── */}
        <section className="relative max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pb-16 md:pb-24">
          <div className={blobTeal} aria-hidden="true" />
          <SectionHeading
            badge="Cara Kerja"
            icon={IconLayoutDashboard}
            title={<>Untuk <span className="text-teal-500">Merchant</span></>}
            subtitle="Setup dalam hitungan menit"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stepsMerchant.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-5 md:p-6 hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full bg-teal-500/10 text-teal-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="w-9 h-9 bg-teal-500/10 rounded-xl flex items-center justify-center">
                    <s.icon className="w-4 h-4 text-teal-500" />
                  </div>
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-1">{s.step}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── FITUR ─── */}
        <section id="features" className="relative max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pb-16 md:pb-24">
          <div className={blobOrange} aria-hidden="true" />
          <SectionHeading
            badge="Fitur"
            icon={IconLayoutDashboard}
            title={<>Fitur Lengkap <span className="text-teal-500">Tunggu.id</span></>}
            subtitle="Semua yang kamu butuh buat kelola antrian"
          />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-4 md:p-5 hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-0.5 transition-all"
              >
                <div className="w-9 h-9 bg-teal-500/10 rounded-xl flex items-center justify-center mb-3">
                  <f.icon className="w-4 h-4 text-teal-500" />
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── DASHBOARD PREVIEW ─── */}
        <section className="relative max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pb-16 md:pb-24">
          <div className={blobTeal} aria-hidden="true" />
          <SectionHeading
            badge="Dashboard"
            icon={IconChartBar}
            title={<>Kelola Antrian <span className="text-teal-500">Real-time</span></>}
            subtitle="Pantau dan kelola antrian dari mana saja"
          />

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-2xl p-5 md:p-7 space-y-4 hover:shadow-lg hover:shadow-teal-500/5 transition-all"
            >
              {[
                { icon: IconUsers, label: 'Total Antrian', color: 'bg-primary' },
                { icon: IconCircleCheck, label: 'Selesai', color: 'bg-green-500' },
                { icon: IconClock, label: 'Menunggu', color: 'bg-yellow-500' },
                { icon: IconPlayerSkipForward, label: 'Dilewati', color: 'bg-red-500' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}>
                    <s.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded-full w-3/4">
                      <div className={`h-2 rounded-full ${s.color} w-3/4`} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground">{s.label}</span>
                </div>
              ))}
              <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border">
                Preview statistik real-time dashboard
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3">
                <IconCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Pantau Langsung</h4>
                  <p className="text-xs text-muted-foreground">Lihat antrian siapa yang harus dipanggil, dilayani, atau diselesaikan</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Panggil Sekali Klik</h4>
                  <p className="text-xs text-muted-foreground">Status antrian berubah real-time, pelanggan lihat langsung di HP mereka</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Filter & Cari</h4>
                  <p className="text-xs text-muted-foreground">Cari pelanggan, filter status, atau lihat antrian per layanan</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Laporan Harian</h4>
                  <p className="text-xs text-muted-foreground">Statistik lengkap: total, selesai, dilewati, peak hour, breakdown layanan</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── TESTIMONI ─── */}
        <section className="relative max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pb-16 md:pb-24">
          <div className={blobOrange} aria-hidden="true" />
          <SectionHeading
            badge="Testimoni"
            icon={IconStarFilled}
            title={<>Apa Kata <span className="text-teal-500">Pengguna</span></>}
            subtitle="Mereka sudah merasakan manfaat Tunggu.id"
          />

          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-5 md:p-6 hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, ri) => (
                    <IconStarFilled key={ri} className="w-4 h-4 text-yellow-500" />
                  ))}
                  {Array.from({ length: 5 - t.rating }).map((_, ri) => (
                    <IconStar key={ri} className="w-4 h-4 text-muted-foreground/30" />
                  ))}
                </div>
                <p className="text-sm text-foreground mb-4 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="relative max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pb-16 md:pb-24">
          <div className={blobTeal} aria-hidden="true" />
          <SectionHeading
            badge="FAQ"
            icon={IconHelp}
            title={<>Pertanyaan <span className="text-teal-500">Umum</span></>}
            subtitle="Yang sering ditanyakan"
          />

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-teal-500/5 transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium text-sm text-foreground">{faq.q}</span>
                  <IconChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="relative max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pb-16 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-teal-600 to-teal-600 rounded-2xl md:rounded-3xl p-8 md:p-14 text-center text-white shadow-xl shadow-teal-500/20"
          >
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-orange-400/20 rounded-full blur-2xl" aria-hidden="true" />

            <div className="relative z-10">
              <IconWavesElectricity className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 opacity-80" />
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
                Siap Kelola Antrian?
              </h2>
              <p className="mt-2 md:mt-3 text-white/80 max-w-md mx-auto text-sm md:text-base">
                Daftar gratis jadi merchant, kelola antrian dengan mudah.
              </p>
              <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`${adminUrl}/register`}
                  className="px-6 md:px-8 py-3 bg-white text-teal-600 font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg"
                >
                  Daftar Merchant Gratis
                </a>
                <a
                  href={`${adminUrl}/login`}
                  className="px-6 md:px-8 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
                >
                  Masuk
                </a>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-14">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="sm:col-span-2 md:col-span-1">
              <a href="/" className="flex items-center mb-3">
                <img src="/logo/Tunggu.id.png" alt="Tunggu.id" className="h-6 w-auto" />
              </a>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sistem antrian online untuk bisnis kecil. Bikin antrian lebih teratur, pelanggan lebih puas.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">Produk</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollTo('how-customer')} className="hover:text-foreground transition-colors">Cara Kerja</button></li>
                <li><button onClick={() => scrollTo('features')} className="hover:text-foreground transition-colors">Fitur</button></li>
                <li><button onClick={() => scrollTo('faq')} className="hover:text-foreground transition-colors">FAQ</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">Merchant</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href={`${adminUrl}/register`} className="hover:text-foreground transition-colors">Daftar</a></li>
                <li><a href={`${adminUrl}/login`} className="hover:text-foreground transition-colors">Masuk</a></li>
                <li><a href={`${adminUrl}/dashboard`} className="hover:text-foreground transition-colors">Dashboard</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">Kontak</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors">hello@tunggu.id</span></li>
                <li><span className="hover:text-foreground transition-colors">@tunggu_id</span></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── BOTTOM BAR ─── */}
      <div className="border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Tunggu.id. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-foreground transition-colors">Syarat & Ketentuan</a>
          </div>
        </div>
      </div>
    </div>
  );
}
