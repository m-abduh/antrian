'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, X, Loader2, Clock, CreditCard,
  LayoutDashboard, ArrowLeft, AlertCircle,
} from 'lucide-react';
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/lib/hooks/useAdmin';

interface ServiceForm {
  name: string;
  description: string;
  duration: number;
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

  const {
    register, handleSubmit, reset, setValue, formState: { errors },
  } = useForm<ServiceForm>();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') return null;

  const openCreate = () => {
    setEditId(null);
    reset({ name: '', description: '', duration: 30, price: 0 });
    setModalOpen(true);
  };

  const openEdit = (s: { _id: string; name: string; description?: string; duration: number; price: number }) => {
    setEditId(s._id);
    setValue('name', s.name);
    setValue('description', s.description || '');
    setValue('duration', s.duration);
    setValue('price', s.price);
    setModalOpen(true);
  };

  const handleCreate = async (form: ServiceForm) => {
    setServiceError('');
    try {
      await createService.mutateAsync({ ...form, description: form.description || '' });
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Layanan</h1>
              <p className="text-xs text-gray-500">Kelola layanan merchant</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {serviceError && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {serviceError}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !services || services.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum ada layanan</h3>
            <p className="text-gray-500">Tambahkan layanan pertama Anda</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {services.map((s, i) => (
                <motion.div
                  key={s._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900">{s.name}</h4>
                    {s.description && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">{s.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {s.duration} menit
                      </span>
                      {s.price > 0 && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          Rp {s.price.toLocaleString('id-ID')}
                        </span>
                      )}
                      {!s.isActive && (
                        <span className="text-red-500 font-medium">Nonaktif</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(s._id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {deleteConfirm === s._id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center gap-3"
                    >
                      <p className="text-sm text-gray-700">Hapus layanan ini?</p>
                      <button
                        onClick={() => handleDelete(s._id)}
                        disabled={deleteService.isPending}
                        className="px-4 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50"
                      >
                        {deleteService.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Hapus'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                      >
                        Batal
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {editId ? 'Edit Layanan' : 'Tambah Layanan'}
              </h2>
              <button onClick={() => { setModalOpen(false); reset(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(editId ? handleUpdate : handleCreate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Layanan</label>
                <input
                  {...register('name', { required: 'Nama layanan wajib diisi' })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nama layanan"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  {...register('description')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                  placeholder="Deskripsi layanan (opsional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
                  <input
                    type="number"
                    {...register('duration', { required: true, min: { value: 1, message: 'Minimal 1 menit' } })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.duration && <p className="mt-1 text-sm text-red-500">{errors.duration.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    {...register('price', { required: true, min: { value: 0, message: 'Minimal Rp 0' } })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); reset(); }}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createService.isPending || updateService.isPending}
                  className="flex-1 py-2.5 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(createService.isPending || updateService.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
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
