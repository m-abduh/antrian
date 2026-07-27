'use client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import {
  IconCreditCard, IconMapPin, IconPhone, IconShoppingCart, IconBuildingStore,
  IconWavesElectricity, IconPlus, IconMinus, IconSparkles, IconBell, IconCheck,
  IconArrowRight,
} from '@tabler/icons-react';
import { useMerchant, useServices, useGroups } from '@/lib/hooks/useMerchant';
import { useCartStore } from '@/lib/store/cartStore';
import { imageUrl } from '@/lib/imageUrl';
import { getActiveQueue, clearActiveQueue } from '@/lib/activeQueue';
import { SocialIcon } from '@/components/SocialIcon';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Service } from '@/lib/types';

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-muted rounded-2xl animate-pulse ${className}`} />;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 },
  },
};

export function MerchantClient({ slug }: { slug: string }) {
  const { data: merchant, isLoading: merchantLoading } = useMerchant(slug);
  const { data: services, isLoading: servicesLoading } = useServices(slug);
  const { data: groups } = useGroups(slug);
  const { items, addItem, updateQuantity, totalPrice, itemCount } = useCartStore();
  const [activeQ, setActiveQ] = useState<{ queueId: string; number: string } | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

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

  const groupOptions = useMemo(() => {
    const opts: { id: string; label: string }[] = [{ id: 'all', label: 'Semua' }];
    if (groups) groups.forEach(g => opts.push({ id: g._id, label: g.name }));
    if (grouplessServices.length > 0) opts.push({ id: 'ungrouped', label: 'Lainnya' });
    return opts;
  }, [groups, grouplessServices]);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    if (selectedGroup === 'all') return groups;
    return groups.filter(g => g._id === selectedGroup);
  }, [groups, selectedGroup]);

  const showGroupless = selectedGroup === 'all' || selectedGroup === 'ungrouped';

  if (!slug || merchantLoading || servicesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 md:w-20 md:h-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-20 w-full rounded-2xl" />
           <div className="flex flex-wrap gap-3 md:gap-4">
             {[...Array(5)].map((_, i) => (
               <div key={i} className="w-[180px] flex-shrink-0 overflow-hidden rounded-2xl border border-border">
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
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
            <IconBuildingStore className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Merchant tidak ditemukan</h1>
          <p className="text-muted-foreground text-sm">QR Code mungkin tidak valid atau merchant tidak aktif</p>
          <Link href="/" className="mt-6 inline-flex items-center justify-center h-9 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
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
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative bg-card border rounded-2xl overflow-hidden transition-all duration-200 ${
          qty > 0
            ? 'border-primary/40 ring-2 ring-primary/15 shadow-sm shadow-primary/5'
            : 'border-border hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5'
        }`}
      >
        {qty > 0 && (
          <div className="absolute top-2 left-2 z-10 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
            <IconCheck className="w-3 h-3" strokeWidth={3} />
          </div>
        )}
          {service.image && (
            <div className="w-full aspect-square overflow-hidden rounded-2xl">
              <img
                src={imageUrl(service.image)}
                alt={service.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
        <div className={`${service.image ? 'p-3' : 'p-3.5'}`}>
          <div className="flex items-start gap-2.5">
            {!service.image && (
              <div className="w-9 h-9 md:w-10 md:h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconCreditCard className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground leading-tight truncate">{service.name}</h3>
              {service.description && (
                <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{service.description}</p>
              )}
              <p className="font-semibold text-foreground text-xs mt-1.5 font-mono tabular-nums">
                {service.price > 0 ? `Rp${service.price.toLocaleString('id-ID')}` : 'Gratis'}
              </p>
            </div>
          </div>
          <div className="mt-2.5">
            {qty > 0 ? (
              <div className="flex items-center justify-between bg-muted/50 rounded-xl p-0.5">
                <button
                  onClick={() => updateQuantity(service._id, qty - 1)}
                  className="w-7 h-7 rounded-lg bg-card text-foreground hover:text-primary transition-colors flex items-center justify-center shadow-xs"
                >
                  <IconMinus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-foreground font-mono tabular-nums">{qty}</span>
                <button
                  onClick={() => addItem(service)}
                  className="w-7 h-7 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center shadow-xs"
                >
                  <IconPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => addItem(service)}
                className="w-full py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all text-xs font-semibold flex items-center justify-center gap-1"
              >
                <IconPlus className="w-3.5 h-3.5" />
                Tambah
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const hasContent = services && services.length > 0;
  const noGroupsAtAll = !groups?.length && !grouplessServices.length;

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-6 relative">
      {/* Decorative background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-3xl animate-float-slow" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-primary/[0.02] blur-3xl animate-float-reverse" />
      </div>
      <main className="max-w-5xl mx-auto px-4 pt-6 pb-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Left column */}
            <div className="md:col-span-3 space-y-6">

          {/* Banner + Hero */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/[0.06] via-primary/[0.02] to-transparent border border-primary/[0.06] p-5 md:p-6">
            {merchant.banner && (
              <div className="absolute inset-0">
                <img src={imageUrl(merchant.banner)} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
              </div>
            )}
            <div className="relative z-10">
              <div className="flex items-start gap-4 md:gap-5">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-110 -z-10" />
                  {merchant.image ? (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-muted ring-4 ring-background shadow-md">
                      <img src={imageUrl(merchant.image)} alt={merchant.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center ring-4 ring-background shadow-md">
                      <IconBuildingStore className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{merchant.name}</h1>
                    <Badge variant="secondary" className="text-[10px] md:text-xs font-mono px-2 py-0 rounded-full">
                      @{merchant.slug}
                    </Badge>
                  </div>
                  {merchant.description && (
                    <p className="text-sm md:text-base text-muted-foreground/80 mt-2 leading-relaxed line-clamp-2">{merchant.description}</p>
                  )}
                  {(merchant.address || merchant.phone) && (
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {merchant.address && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/70 rounded-full px-2.5 py-1 truncate max-w-full">
                          <IconMapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[160px] md:max-w-[240px]">{merchant.address}</span>
                        </span>
                      )}
                      {merchant.phone && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/70 rounded-full px-2.5 py-1">
                          <IconPhone className="w-3 h-3 flex-shrink-0" />
                          {merchant.phone}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {merchant.socialLinks?.length > 0 && (
                  <div className="flex-shrink-0 flex flex-row gap-2">
                    {merchant.socialLinks.map(link => (
                      <a
                        key={link.platform}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group w-8 h-8 md:w-9 md:h-9 rounded-full bg-muted/60 hover:bg-primary/10 text-muted-foreground hover:text-primary flex items-center justify-center transition-all duration-200 hover:shadow-sm hover:shadow-primary/10"
                      >
                        <SocialIcon platform={link.platform} className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-primary/[0.06]">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground font-mono tabular-nums">{services?.length || 0}</span>
                  Layanan
                </div>
                {groups && groups.length > 0 && (
                  <>
                    <span className="text-muted-foreground/30">·</span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground font-mono tabular-nums">{groups.length}</span>
                      Kategori
                    </div>
                  </>
                )}
                <span className="text-muted-foreground/30">·</span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Buka
                </div>
              </div>
            </div>
          </div>

          {/* Antrian aktif */}
          <AnimatePresence>
            {activeQ && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Link href={`/queue/${activeQ.queueId}`} className="relative flex items-stretch bg-gradient-to-r from-primary/[0.06] to-primary/[0.02] border border-primary/15 rounded-2xl overflow-hidden hover:from-primary/[0.08] hover:to-primary/[0.04] transition-all group">
                  <div className="hidden md:flex absolute left-0 top-0 bottom-0 w-1 bg-primary/30 rounded-l-2xl" />
                  <div className="flex items-center gap-3 flex-1 min-w-0 p-4">
                    <div className="relative w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <IconBell className="w-4 h-4 text-primary" />
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Antrian Aktif — tap untuk lihat status</p>
                      <p className="text-sm font-semibold text-foreground truncate">Sedang berjalan</p>
                    </div>
                  </div>
                  <div className="relative flex items-center gap-2.5 px-4 border-l border-dashed border-primary/20">
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-background" />
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-background" />
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/60">No.</p>
                      <p className="font-mono text-lg font-bold text-primary tabular-nums leading-none">{activeQ.number}</p>
                    </div>
                    <IconArrowRight className="w-4 h-4 text-primary/40 group-hover:text-primary/70 transition-all flex-shrink-0 group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter Grup */}
          {groupOptions.length > 1 && (
            <div className="relative">
              <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide -mx-4 px-4">
                {groupOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedGroup(opt.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                      selectedGroup === opt.id
                        ? 'bg-primary text-primary-foreground shadow-xs scale-[1.02]'
                        : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Layanan */}
          {hasContent ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-7">
              {filteredGroups.map((group, idx) => (
                <motion.div key={group._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 md:h-5 rounded-full bg-primary/60 flex-shrink-0" />
                    <h2 className="text-sm md:text-base font-bold text-foreground">{group.name}</h2>
                    <span className="text-[11px] text-muted-foreground/50 font-mono">({group.serviceIds.length})</span>
                  </div>
                  <div className="relative">
                    <div className="flex overflow-x-auto scrollbar-hide gap-4 px-1 pb-1">
                      {group.serviceIds.map(service => (
                        <div key={service._id} className="w-[180px] flex-shrink-0">
                          {renderService(service)}
                        </div>
                      ))}
                    </div>
                    <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background via-background/60 to-transparent pointer-events-none" />
                  </div>
                 </motion.div>
               ))}

              {showGroupless && grouplessServices.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 md:h-5 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                    <h2 className="text-sm md:text-base font-bold text-foreground">Lainnya</h2>
                    <span className="text-[11px] text-muted-foreground/50 font-mono">({grouplessServices.length})</span>
                  </div>
                  <div className="relative">
                    <div className="flex overflow-x-auto scrollbar-hide gap-4 px-1 pb-1">
                      {grouplessServices.map(service => (
                        <div key={service._id} className="w-[180px] flex-shrink-0">
                          {renderService(service)}
                        </div>
                      ))}
                    </div>
                    <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background via-background/60 to-transparent pointer-events-none" />
                  </div>
                </motion.div>
              )}

              {noGroupsAtAll && (
                <div className="bg-gradient-to-br from-card to-muted/30 border border-dashed border-border rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <IconBuildingStore className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Belum Ada Layanan</h3>
                  <p className="text-muted-foreground text-sm">Silakan hubungi admin untuk menambah layanan</p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="bg-gradient-to-br from-card to-muted/30 border border-dashed border-border rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <IconBuildingStore className="w-8 h-8 text-muted-foreground/20" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Belum Ada Layanan</h3>
              <p className="text-muted-foreground text-sm">Silakan hubungi admin untuk menambah layanan</p>
            </div>
          )}
            </div>

            {/* Right column */}
            <div className="md:col-span-2 space-y-4 md:sticky md:top-6 md:self-start">

               {/* Cart Summary */}
                <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden">
                 <div className="p-4 border-b border-border">
                   <div className="flex items-center gap-2">
                     <IconShoppingCart className="w-4 h-4 text-primary" />
                     <h3 className="font-semibold text-sm text-foreground">Keranjang</h3>
                     {itemCount() > 0 && (
                       <span className="text-[11px] text-muted-foreground/50 font-mono">({itemCount()})</span>
                     )}
                   </div>
                 </div>
                 <div className="p-4 space-y-2.5">
                   {items.length === 0 ? (
                     <div className="text-center py-4">
                       <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                         <IconShoppingCart className="w-5 h-5 text-muted-foreground/30" />
                       </div>
                       <p className="text-xs text-muted-foreground">Belum ada item</p>
                       <p className="text-[10px] text-muted-foreground/60 mt-1">Pilih layanan untuk mulai</p>
                     </div>
                   ) : (
                     <>
                       {items.slice(0, 5).map((item) => (
                         <div key={item._id} className="flex items-center justify-between text-sm">
                           <span className="text-foreground truncate mr-2">{item.name} <span className="font-mono text-muted-foreground/60">x{item.quantity}</span></span>
                           <span className="text-xs font-semibold text-foreground tabular-nums whitespace-nowrap">
                             {item.price > 0 ? `Rp${(item.price * item.quantity).toLocaleString('id-ID')}` : 'Gratis'}
                           </span>
                         </div>
                       ))}
                       {items.length > 5 && (
                         <p className="text-xs text-center text-muted-foreground">+{items.length - 5} lainnya</p>
                       )}
                       <Separator className="my-1" />
                       <div className="flex items-center justify-between pt-1">
                         <span className="text-sm font-medium text-foreground">Total</span>
                         <span className="text-sm font-bold text-foreground tabular-nums">
                           {totalPrice() > 0 ? `Rp${totalPrice().toLocaleString('id-ID')}` : 'Gratis'}
                         </span>
                       </div>
                       <Link
                         href="/cart"
                         className="mt-3 w-full inline-flex items-center justify-center h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all gap-1.5"
                       >
                         Pesan Sekarang
                         <IconArrowRight className="w-3.5 h-3.5" />
                       </Link>
                     </>
                   )}
                 </div>
               </div>

              {/* Cara Pakai */}
              <div className="relative bg-gradient-to-br from-primary/[0.04] to-transparent border border-primary/[0.08] rounded-2xl p-4 md:p-5">
                <h4 className="font-semibold text-xs md:text-sm text-foreground mb-3 flex items-center gap-1.5">
                  <IconSparkles className="w-3.5 h-3.5 text-primary" />
                  Cara Pakai
                </h4>
                <div className="relative grid grid-cols-2 gap-2">
                  {[
                    { icon: IconPlus, label: 'Pilih Layanan', desc: 'Tap + pada layanan yang diinginkan' },
                    { icon: IconShoppingCart, label: 'Buka Keranjang', desc: 'Tap ikon keranjang di bawah' },
                    { icon: IconWavesElectricity, label: 'Ambil Antrian', desc: 'Isi data diri & submit' },
                    { icon: IconMapPin, label: 'Pantau Real-time', desc: 'Lihat posisi antrianmu' },
                  ].map(({ icon: Icon, label, desc }, i) => (
                    <div key={i} className="relative group cursor-default">
                      <div className="relative flex flex-col items-center p-2.5 rounded-xl bg-background/50 hover:bg-background/80 border border-transparent hover:border-primary/[0.06] transition-all duration-200 hover:-translate-y-0.5">
                        <div className="relative w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-1.5 text-[11px] font-bold font-mono shadow-xs">
                          {i + 1}
                        </div>
                        <Icon className="w-3.5 h-3.5 text-primary/60 mb-0.5" />
                        <p className="text-[11px] md:text-xs font-semibold text-foreground text-center leading-tight">{label}</p>
                        <p className="text-[9px] md:text-[11px] text-muted-foreground/70 mt-0.5 leading-snug text-center">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Cart bar — floating */}
      <AnimatePresence>
        {itemCount() > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className="fixed bottom-3 left-3 right-3 z-40 md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 bg-card/80 backdrop-blur-xl border border-border/80 rounded-2xl shadow-lg shadow-primary/5 p-3 md:p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <IconShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center font-mono">
                    {itemCount()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {items.slice(0, 2).map(i => i.name).join(', ')}
                    {items.length > 2 && <span className="text-muted-foreground font-normal">, +{items.length - 2} lainnya</span>}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono tabular-nums">
                    {totalPrice() > 0 ? `Rp${totalPrice().toLocaleString('id-ID')}` : 'Gratis'}
                  </p>
                </div>
              </div>
              <Link
                href="/cart"
                className="inline-flex items-center justify-center h-9 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-xs gap-2 flex-shrink-0"
              >
                Pesan
                <IconArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
       </AnimatePresence>
     </div>
   );
}
