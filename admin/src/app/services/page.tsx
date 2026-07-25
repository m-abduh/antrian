'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, X, Loader2, Clock, CreditCard,
  LayoutDashboard, ArrowLeft, AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/lib/hooks/useAdmin';

interface ServiceForm {
  name: string;
  description: string;
  duration: number;
  price: number;
}

export default function ServicesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
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
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

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

  const onSubmit = async (data: ServiceForm) => {
    setServiceError('');
    try {
      if (editId) {
        await updateService.mutateAsync({ id: editId, data });
      } else {
        await createService.mutateAsync(data);
      }
      setModalOpen(false);
    } catch (err: any) {
      setServiceError(err.message || 'Gagal menyimpan layanan');
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

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">Layanan</h1>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {serviceError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 flex-1">{serviceError}</p>
            <button onClick={() => setServiceError('')}><X className="w-4 h-4 text-red-400" /></button>
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !services || services.length === 0 ? (
          <div className="text-center py-20">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum ada layanan</h3>
            <p className="text-gray-500">Tambahkan layanan untuk memulai</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {services.map((s, i) => (
                <motion.div
                  key={s._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-white rounded-2xl shadow-sm p-4 ${!s.isActive ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 truncate">{s.name}</h4>
                        {!s.isActive && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">Nonaktif</span>
                        )}
                      </div>
                      {s.description && (
                        <p className="text-sm text-gray-500 truncate">{s.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {s.duration} menit
                        </span>
                        <span className="flex items-center gap-1 font-medium text-gray-900">
                          {s.price > 0 ? `Rp ${s.price.toLocaleString('id-ID')}` : 'Gratis'}
                        </span>
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
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {editId ? 'Edit Layanan' : 'Tambah Layanan'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Layanan *</label>
                  <input
                    {...register('name', { required: 'Nama wajib diisi' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Potong Rambut"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea
                    {...register('description')}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Deskripsi layanan..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit) *</label>
                    <input
                      type="number"
                      {...register('duration', {
                        required: 'Durasi wajib diisi',
                        min: { value: 1, message: 'Min 1 menit' },
                        max: { value: 480, message: 'Max 480 menit' },
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.duration && <p className="mt-1 text-sm text-red-500">{errors.duration.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) *</label>
                    <input
                      type="number"
                      {...register('price', {
                        required: 'Harga wajib diisi',
                        min: { value: 0, message: 'Min Rp 0' },
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0 = Gratis"
                    />
                    {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>}
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={createService.isPending || updateService.isPending}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createService.isPending || updateService.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : editId ? (
                    'Simpan Perubahan'
                  ) : (
                    'Tambah Layanan'
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-sm p-6 text-center"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Layanan?</h3>
              <p className="text-sm text-gray-500 mb-6">Layanan akan dinonaktifkan, bukan dihapus permanen</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleteService.isPending}
                  className="flex-1 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 disabled:opacity-50"
                >
                  {deleteService.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Hapus'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}