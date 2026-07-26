'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { CreditCard, MapPin, Phone, ShoppingCart, Store, Waves, Plus, Minus } from 'lucide-react';
import { useMerchant, useServices, useGroups } from '@/lib/hooks/useMerchant';
import { useCartStore } from '@/lib/store/cartStore';
import { imageUrl } from '@/lib/imageUrl';
import type { Service } from '@/lib/types';

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-muted rounded-2xl animate-pulse ${className}`} />;
}

export default function MerchantPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: merchant, isLoading: merchantLoading } = useMerchant(slug);
  const { data: services, isLoading: servicesLoading } = useServices(slug);
  const { data: groups } = useGroups(slug);
  const { items, addItem, updateQuantity, totalPrice, itemCount } = useCartStore();

  const getQty = (id: string) => items.find((i) => i._id === id)?.quantity || 0;

  const grouplessServices = useMemo(() => {
    if (!services || !groups) return services || [];
    const groupedIds = new Set(groups.flatMap(g => g.serviceIds.map(s => s._id)));
    return services.filter(s => !groupedIds.has(s._id));
  }, [services, groups]);

  if (merchantLoading || servicesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4 py-6 space-y-4">
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

  const renderService = (service: Service) => {
    const qty = getQty(service._id);
    return (
      <motion.div
        key={service._id}
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        className={`bg-card border rounded-2xl overflow-hidden transition-all ${qty > 0 ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:shadow-md hover:border-primary/30'}`}
      >
        {service.image && (
          <div className="w-full h-28 md:h-32 bg-muted">
            <img src={imageUrl(service.image)} alt={service.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex items-center gap-3 p-4 md:p-5">
          {!service.image && (
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm md:text-base text-foreground truncate">{service.name}</h3>
            {service.description && (
              <p className="text-xs md:text-sm text-muted-foreground truncate mt-0.5">{service.description}</p>
            )}
            <p className="font-semibold text-foreground text-xs md:text-sm mt-1.5">
              {service.price > 0 ? `Rp${service.price.toLocaleString('id-ID')}` : 'Gratis'}
            </p>
          </div>
          {qty > 0 ? (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => updateQuantity(service._id, qty - 1)}
                className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center"
              >
                <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <span className="w-6 text-center text-sm font-semibold text-foreground">{qty}</span>
              <button
                onClick={() => addItem(service)}
                className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(service)}
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center flex-shrink-0"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border">
        <div className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground text-sm md:text-base">Antriin</span>
          </div>
          <Link
            href={`/${slug}/cart`}
            className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Lihat keranjang"
          >
            <ShoppingCart className="w-5 h-5" />
            {itemCount() > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount()}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {merchant.image && (
              <div className="w-full h-40 md:h-52 bg-muted">
                <img src={imageUrl(merchant.image)} alt={merchant.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5 md:p-6">
              <div className="flex items-start gap-4">
                {!merchant.image && (
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Store className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                  </div>
                )}
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
          </div>

          {services && services.length > 0 ? (
            <div className="space-y-6">
              {groups && groups.map((group) => (
                <div key={group._id}>
                  <h2 className="text-base md:text-lg font-semibold text-foreground mb-3">{group.name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.serviceIds.map(renderService)}
                  </div>
                </div>
              ))}
              {grouplessServices.length > 0 && (
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-foreground mb-3">Lainnya</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {grouplessServices.map(renderService)}
                  </div>
                </div>
              )}
              {!groups?.length && !grouplessServices.length && (
                <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
                  <CreditCard className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-base md:text-lg font-medium text-foreground mb-2">Belum Ada Layanan</h3>
                  <p className="text-muted-foreground text-xs md:text-sm">Silakan hubungi admin untuk menambah layanan</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
              <CreditCard className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-medium text-foreground mb-2">Belum Ada Layanan</h3>
              <p className="text-muted-foreground text-xs md:text-sm">Silakan hubungi admin untuk menambah layanan</p>
            </div>
          )}

          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 md:p-5">
            <h4 className="font-semibold text-sm md:text-base text-foreground mb-3 flex items-center gap-2">
              <Waves className="w-4 h-4 text-primary" />
              Cara Pakai
            </h4>
            <ol className="text-xs md:text-sm text-muted-foreground space-y-2">
              {['Pilih layanan dengan tap ikon +', 'Tap ikon keranjang di atas', 'Isi data diri & dapatkan antrian', 'Pantau posisi antrian real-time'].map((step, i) => (
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

      {itemCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border p-3 md:p-4 shadow-lg">
          <div className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{itemCount()} Layanan</p>
                <p className="text-xs text-muted-foreground">
                  {totalPrice() > 0 ? `Rp${totalPrice().toLocaleString('id-ID')}` : 'Gratis'}
                </p>
              </div>
            </div>
            <Link
              href={`/${slug}/cart`}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm text-sm flex items-center gap-2"
            >
              Pesan
              <ShoppingCart className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
