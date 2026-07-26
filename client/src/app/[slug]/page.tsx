'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CreditCard, Clock, MapPin, Phone, ArrowRight, Store, Waves } from 'lucide-react';
import { useMerchant, useServices } from '@/lib/hooks/useMerchant';
import { useClientStore } from '@/lib/store/clientStore';

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-muted rounded-2xl animate-pulse ${className}`} />;
}

export default function MerchantPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: merchant, isLoading: merchantLoading } = useMerchant(slug);
  const { data: services, isLoading: servicesLoading } = useServices(slug);
  const { setMerchant, setService } = useClientStore();

  if (merchantLoading || servicesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-44 md:h-48 w-full" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <Store className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Merchant tidak ditemukan</h1>
          <p className="text-muted-foreground text-sm">QR Code mungkin tidak valid atau merchant tidak aktif</p>
          <Link href="/" className="inline-flex mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-all">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground text-sm md:text-base">Antriin</span>
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Beranda
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Store className="w-7 h-7 md:w-8 md:h-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-foreground truncate">{merchant.name}</h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">@{merchant.slug}</p>
                {merchant.address && (
                  <div className="flex items-start gap-1.5 text-xs md:text-sm text-muted-foreground mt-2 md:mt-3">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{merchant.address}</span>
                  </div>
                )}
                {merchant.phone && (
                  <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground mt-1">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{merchant.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-foreground">Layanan Tersedia</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {services?.length ?? 0} layanan
              </span>
            </div>
            {services && services.length > 0 ? (
              <div className="space-y-3">
                {services.map((service, index) => (
                  <Link key={service._id} href={`/${slug}/order`}>
                    <motion.button
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      onClick={() => {
                        setMerchant(merchant);
                        setService(service);
                      }}
                      className="w-full text-left bg-card border border-border rounded-2xl p-4 md:p-5 hover:shadow-md hover:border-primary/30 transition-all flex items-center gap-3 md:gap-4 group"
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base text-foreground truncate group-hover:text-primary transition-colors">{service.name}</h3>
                        {service.description && (
                          <p className="text-xs md:text-sm text-muted-foreground truncate mt-0.5">{service.description}</p>
                        )}
                        <div className="flex items-center gap-3 md:gap-4 mt-1.5 text-xs md:text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            {service.duration} menit
                          </span>
                          <span className="font-semibold text-foreground">
                            {service.price > 0
                              ? `Rp${service.price.toLocaleString('id-ID')}`
                              : 'Gratis'}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </motion.button>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
                <CreditCard className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-base md:text-lg font-medium text-foreground mb-2">Belum Ada Layanan</h3>
                <p className="text-muted-foreground text-xs md:text-sm">Silakan hubungi admin untuk menambah layanan</p>
              </div>
            )}
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 md:p-5">
            <h4 className="font-semibold text-sm md:text-base text-foreground mb-3 flex items-center gap-2">
              <Waves className="w-4 h-4 text-primary" />
              Cara Pakai
            </h4>
            <ol className="text-xs md:text-sm text-muted-foreground space-y-2">
              {['Pilih layanan di atas', 'Isi nama & nomor telepon', 'Dapatkan nomor antrian', 'Pantau posisi antrian real-time'].map((step, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-semibold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
