'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconPlus, IconPencil, IconTrash, IconX, IconLoader2, IconCreditCard,
  IconLayoutDashboard, IconAlertCircle, IconWavesElectricity, IconUpload,
} from '@tabler/icons-react';
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/lib/hooks/useAdmin';
import { adminApi } from '@/lib/api/admin';
import { imageUrl } from '@/lib/imageUrl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    setModalOpen(true);
  };

  const openEdit = (s: { _id: string; name: string; description?: string; image?: string; price: number }) => {
    setEditId(s._id);
    setValue('name', s.name);
    setValue('description', s.description || '');
    setValue('image', s.image || '');
    setValue('price', s.price);
    setModalOpen(true);
  };

  const handleCreate = async (form: ServiceForm) => {
    setServiceError('');
    try {
      await createService.mutateAsync({ ...form, description: form.description || '', image: form.image || '' });
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
      await updateService.mutateAsync({ id: editId, data: form });
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
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 pl-10 lg:pl-0">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:opacity-90 transition-all shadow-sm"
              >
                <IconLayoutDashboard className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-foreground">Layanan</h1>
                <p className="text-xs text-muted-foreground">Kelola layanan merchant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={openCreate}>
                <IconPlus className="w-4 h-4 mr-2" />
                Tambah Layanan
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {serviceError && (
          <Alert variant="destructive" className="mb-4">
            <IconAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <AlertDescription>{serviceError}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !services || services.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <IconWavesElectricity className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Belum ada layanan</h3>
            <p className="text-muted-foreground mb-6">Tambahkan layanan pertama Anda</p>
            <Button onClick={openCreate}>
              <IconPlus className="w-4 h-4 mr-2" />
              Tambah Layanan
            </Button>
          </motion.div>
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
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <IconCreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-auto">
                    <span className="font-medium text-foreground">
                      {s.price > 0 ? `Rp${s.price.toLocaleString('id-ID')}` : 'Gratis'}
                    </span>
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
                </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6"
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
                <label className="block text-sm font-medium text-foreground mb-1">Nama Layanan</label>
                <input
                  {...register('name', { required: 'Nama layanan wajib diisi' })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                  placeholder="Nama layanan"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Foto Produk</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
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
                    className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors text-sm"
                  >
                    {uploading ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconUpload className="w-4 h-4" />}
                    {uploading ? 'Mengupload...' : 'Pilih Gambar'}
                  </button>
                  <input type="hidden" {...register('image')} />
                </div>
                {watch('image') && (
                  <div className="mt-2 w-24 aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={imageUrl(watch('image'))} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Deskripsi</label>
                <textarea
                  {...register('description')}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent h-20 resize-none text-sm"
                  placeholder="Deskripsi layanan (opsional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Harga (Rp)</label>
                <input
                  type="number"
                  {...register('price', { required: true, min: { value: 0, message: 'Minimal Rp 0' } })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                />
                {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); reset(); }}
                  className="flex-1 py-2.5 border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createService.isPending || updateService.isPending}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  {(createService.isPending || updateService.isPending) && <IconLoader2 className="w-4 h-4 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
