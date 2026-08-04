'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconPlus, IconPencil, IconTrash, IconX, IconLoader2, IconCreditCard,
  IconAlertCircle, IconUpload,
} from '@tabler/icons-react';
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/lib/hooks/useAdmin';
import { adminApi } from '@/lib/api/admin';
import { imageUrl } from '@/lib/imageUrl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/ErrorAlert';

interface ServiceForm {
  name: string;
  description: string;
  image: string;
  price: number;
}

export default function ServicesPage() {
  const router = useRouter();
  const { status } = useSession();
  const { data: services, isLoading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [variants, setVariants] = useState<{ name: string; price: number }[]>([]);

  const {
    register, handleSubmit, reset, setValue, watch, formState: { errors },
  } = useForm<ServiceForm>();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') return null;

  const openCreate = () => {
    setEditId(null);
    reset({ name: '', description: '', image: '', price: 0 });
    setVariants([]);
    setModalOpen(true);
  };

  const openEdit = (s: { _id: string; name: string; description?: string; image?: string; price: number; variants?: { name: string; price: number }[] }) => {
    setEditId(s._id);
    setValue('name', s.name);
    setValue('description', s.description || '');
    setValue('image', s.image || '');
    setValue('price', s.price);
    setVariants(s.variants ? s.variants.map(v => ({ ...v })) : []);
    setModalOpen(true);
  };

  const setVariant = (index: number, patch: Partial<{ name: string; price: number }>) => {
    setVariants(prev => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  };

  const handleCreate = async (form: ServiceForm) => {
    setServiceError('');
    try {
      await createService.mutateAsync({
        ...form,
        description: form.description || '',
        image: form.image || '',
        variants: variants.filter(v => v.name.trim()),
      });
      setModalOpen(false);
      reset();
    } catch (err: any) {
      setServiceError(err.message || 'Gagal menyimpan layanan');
    }
  };

  const handleUpdate = async (form: ServiceForm) => {
    if (!editId) return;
    setServiceError('');
    try {
      await updateService.mutateAsync({
        id: editId,
        data: { ...form, variants: variants.filter(v => v.name.trim()) },
      });
      setModalOpen(false);
      reset();
    } catch (err: any) {
      setServiceError(err.message || 'Gagal memperbarui layanan');
    }
  };

  const handleDelete = async (id: string) => {
    setServiceError('');
    try {
      await deleteService.mutateAsync(id);
      setDeleteConfirm(null);
    } catch (err: any) {
      setServiceError(err.message || 'Gagal menghapus layanan');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Layanan</h1>
            <p className="text-sm text-muted-foreground mt-1">Kelola layanan merchant</p>
          </div>
          <Button onClick={openCreate} className="rounded-xl">
            <IconPlus className="w-4 h-4 mr-2" />
            Tambah Layanan
          </Button>
        </div>

        <Separator />

        <ErrorAlert message={serviceError} onClose={() => setServiceError('')} />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-2xl p-4">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !services || services.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <IconCreditCard className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Belum ada layanan</h3>
              <p className="text-sm text-muted-foreground mb-4">Tambahkan layanan pertama Anda</p>
              <Button onClick={openCreate} className="rounded-xl">
                <IconPlus className="w-4 h-4 mr-2" />
                Tambah Layanan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {services.map((s, i) => (
                <motion.div
                  key={s._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="rounded-2xl hover:shadow-md transition-all relative group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <IconPencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(s._id)}
                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>

                      {s.image && (
                        <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-muted">
                          <img src={imageUrl(s.image)} alt={s.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <h4 className="font-semibold text-foreground mb-1">{s.name}</h4>
                      {s.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{s.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-sm mt-auto">
                        <span className="font-medium text-foreground">
                          {s.variants && s.variants.length > 0
                            ? (() => {
                                const prices = s.variants!.map(v => v.price);
                                const min = Math.min(...prices);
                                const max = Math.max(...prices);
                                return min === max
                                  ? `Rp${min.toLocaleString('id-ID')}`
                                  : `Rp${min.toLocaleString('id-ID')} – Rp${max.toLocaleString('id-ID')}`;
                              })()
                            : s.price > 0
                              ? `Rp${s.price.toLocaleString('id-ID')}`
                              : 'Gratis'}
                        </span>
                        {s.variants && s.variants.length > 0 && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {s.variants.length} varian
                          </span>
                        )}
                        {!s.isActive && (
                          <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">Nonaktif</span>
                        )}
                      </div>

                      {deleteConfirm === s._id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-card/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3 p-5"
                        >
                          <p className="text-sm font-medium text-foreground">Hapus layanan ini?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(s._id)}
                              disabled={deleteService.isPending}
                              className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                            >
                              {deleteService.isPending ? <IconLoader2 className="w-4 h-4 animate-spin" /> : 'Hapus'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-xl hover:bg-muted/80 transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">
                {editId ? 'Edit Layanan' : 'Tambah Layanan'}
              </h2>
              <button onClick={() => { setModalOpen(false); reset(); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(editId ? handleUpdate : handleCreate)} className="space-y-4">
              <div>
                <Label>Nama Layanan</Label>
                <Input
                  {...register('name', { required: 'Nama layanan wajib diisi' })}
                  placeholder="Nama layanan"
                  className="mt-1.5"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <Label>Foto Produk</Label>
                <div className="flex items-center gap-3 mt-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async () => {
                        const file = input.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const { url } = await adminApi.uploadImage(file);
                          setValue('image', url);
                        } catch {
                          setServiceError('Gagal upload gambar');
                        } finally {
                          setUploading(false);
                        }
                      };
                      input.click();
                    }}
                    disabled={uploading}
                    className="rounded-xl"
                  >
                    {uploading ? <IconLoader2 className="w-4 h-4 animate-spin mr-2" /> : <IconUpload className="w-4 h-4 mr-2" />}
                    {uploading ? 'Mengupload...' : 'Pilih Gambar'}
                  </Button>
                  <input type="hidden" {...register('image')} />
                </div>
                {watch('image') && (
                  <div className="mt-2 w-24 aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={imageUrl(watch('image'))} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <Label>Deskripsi</Label>
                <textarea
                  {...register('description')}
                  className="w-full mt-1.5 px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent h-20 resize-none text-sm"
                  placeholder="Deskripsi layanan (opsional)"
                />
              </div>

              <div>
                <Label>Harga (Rp)</Label>
                <Input
                  type="number"
                  {...register('price', { required: true, min: { value: 0, message: 'Minimal Rp 0' } })}
                  className="mt-1.5"
                />
                {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label>Varian (opsional)</Label>
                  <button
                    type="button"
                    onClick={() => setVariants(prev => [...prev, { name: '', price: 0 }])}
                    className="text-xs font-medium text-primary hover:opacity-80 transition-opacity flex items-center gap-1"
                  >
                    <IconPlus className="w-3.5 h-3.5" />
                    Tambah Varian
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 mb-2">
                  Contoh: "Es" & "Anget" untuk jus jeruk. Harga pakai harga tiap varian.
                </p>
                {variants.length === 0 ? (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
                    Tanpa varian — produk pakai harga di atas.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {variants.map((v, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={v.name}
                          onChange={(e) => setVariant(idx, { name: e.target.value })}
                          placeholder="Nama varian (mis. Es)"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min={0}
                          value={v.price || ''}
                          onChange={(e) => setVariant(idx, { price: Number(e.target.value) || 0 })}
                          placeholder="Harga"
                          className="w-28"
                        />
                        <button
                          type="button"
                          onClick={() => setVariants(prev => prev.filter((_, i) => i !== idx))}
                          className="p-2 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                          aria-label="Hapus varian"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setModalOpen(false); reset(); }}
                  className="flex-1 rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createService.isPending || updateService.isPending}
                  className="flex-1 rounded-xl"
                >
                  {(createService.isPending || updateService.isPending) && <IconLoader2 className="w-4 h-4 animate-spin mr-2" />}
                  Simpan
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
