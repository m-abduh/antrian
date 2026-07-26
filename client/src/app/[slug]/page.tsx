'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import { CreditCard, MapPin, Phone, ShoppingCart, Store, Waves, Plus, Minus, Sparkles, Bell } from 'lucide-react';
import { useMerchant, useServices, useGroups } from '@/lib/hooks/useMerchant';
import { useCartStore } from '@/lib/store/cartStore';
import { imageUrl } from '@/lib/imageUrl';
import { getActiveQueue, clearActiveQueue } from '@/lib/activeQueue';
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
  const [activeQ, setActiveQ] = useState<{ queueId: string; number: string } | null>(null);

  useEffect(() => {
    const aq = getActiveQueue(slug);
    if (aq && (aq.status === 'waiting' || aq.status === 'called' || aq.status === 'serving')) {
      setActiveQ({ queueId: aq.queueId, number: aq.number });
    } else {
      setActiveQ(null);
    }
  }, [slug]);

  const getQty = (id: string) => items.find((i) => i._id === id)?.quantity || 0;

  const grouplessServices = useMemo(() => {
    if (!services || !groups) return services || [];
    const groupedIds = new Set(groups.flatMap(g => g.serviceIds.map(s => s._id)));
    return services.filter(s => !groupedIds.has(s._id));
  }, [services, groups]);

  if (merchantLoading || servicesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Merchant tidak ditemukan</h1>
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card border rounded-2xl overflow-hidden transition-all duration-200 ${qty > 0 ? 'border-primary ring-1 ring-primary/30 bg-primary/[0.03]' : 'border-border hover:border-primary/20 hover:shadow-md'}`}
      >
        {service.image && (
          <div className="w-full aspect-square bg-muted">
            <img src={imageUrl(service.image)} alt={service.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className={`flex items-center gap-3 ${service.image ? 'p-3.5' : 'p-4'}`}>
          {!service.image && (
            <div className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 md:w-5 md:h-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm md:text-[15px] text-foreground leading-tight truncate">{service.name}</h3>
            {service.description && (
              <p className="text-xs md:text-sm text-muted-foreground/80 truncate mt-0.5">{service.description}</p>
            )}
            <p className="font-semibold text-foreground text-xs md:text-sm mt-1.5">
              {service.price > 0 ? `Rp${service.price.toLocaleString('id-ID')}` : 'Gratis'}
            </p>
          </div>
          {qty > 0 ? (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => updateQuantity(service._id, qty - 1)}
                className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center"
              >
                <Minus className="w-3 h-3 md:w-3.5 md:h-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-semibold text-foreground">{qty}</span>
              <button
                onClick={() => addItem(service)}
                className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center shadow-sm"
              >
                <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(service)}
              className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 transition-all flex items-center justify-center flex-shrink-0"
            >
              <Plus className="w-4 h-4 md:w-4 md:h-4" />
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto px-4 pt-4 pb-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="flex items-start gap-4 md:gap-5">
            {merchant.image ? (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-border mt-0.5">
                <img src={imageUrl(merchant.image)} alt={merchant.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary/15 to-primary/5 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-border mt-0.5">
                <Store className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">{merchant.name}</h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">@{merchant.slug}</p>
              {merchant.description && (
                <p className="text-sm md:text-base text-muted-foreground/80 mt-2 leading-relaxed">{merchant.description}</p>
              )}
              {merchant.address && (
                <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground/70 mt-3">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{merchant.address}</span>
                </div>
              )}
              {merchant.phone && (
                <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground/70 mt-1">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{merchant.phone}</span>
                </div>
              )}
            </div>
          </div>

          {activeQ && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
              <Link
                href={`/${slug}/queue/${activeQ.queueId}`}
                className="flex items-center gap-3 bg-primary/[0.06] border border-primary/15 rounded-2xl p-4 hover:bg-primary/[0.09] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Antrian Aktif</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No. {activeQ.number} — Tap untuk lihat status
                  </p>
                </div>
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </Link>
            </motion.div>
          )}

          {services && services.length > 0 ? (
            <div className="space-y-8">
              {groups && groups.map((group, idx) => (
                <motion.div key={group._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-1 h-5 md:h-6 rounded-full bg-primary flex-shrink-0" />
                    <h2 className="text-base md:text-lg font-bold text-foreground">{group.name}</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {group.serviceIds.map(renderService)}
                  </div>
                </motion.div>
              ))}
              {grouplessServices.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-1 h-5 md:h-6 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                    <h2 className="text-base md:text-lg font-bold text-foreground">Lainnya</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {grouplessServices.map(renderService)}
                  </div>
                </motion.div>
              )}
              {!groups?.length && !grouplessServices.length && (
                <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-7 h-7 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">Belum Ada Layanan</h3>
                  <p className="text-muted-foreground text-sm">Silakan hubungi admin untuk menambah layanan</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-7 h-7 text-muted-foreground/30" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">Belum Ada Layanan</h3>
              <p className="text-muted-foreground text-sm">Silakan hubungi admin untuk menambah layanan</p>
            </div>
          )}

          <div className="bg-gradient-to-br from-primary/[0.04] to-transparent border border-primary/10 rounded-2xl p-5 md:p-6">
            <h4 className="font-semibold text-sm md:text-base text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Cara Pakai
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Plus, label: 'Pilih Layanan', desc: 'Tap + pada layanan yang diinginkan' },
                { icon: ShoppingCart, label: 'Buka Keranjang', desc: 'Tap ikon keranjang di bawah' },
                { icon: Waves, label: 'Ambil Antrian', desc: 'Isi data diri & submit' },
                { icon: MapPin, label: 'Pantau Real-time', desc: 'Lihat posisi antrianmu' },
              ].map(({ icon: Icon, label, desc }, i) => (
                <div key={i} className="text-center p-3 md:p-4 rounded-xl bg-card/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2.5">
                    <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>

      {itemCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-lg border-t border-border p-3 md:p-4 shadow-lg">
          <div className="max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
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
              className="px-6 py-2.5 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm text-sm flex items-center gap-2"
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
