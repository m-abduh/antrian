'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconPlus, IconPencil, IconTrash, IconX, IconLoader2, IconLayoutKanban,
  IconGripVertical,
} from '@tabler/icons-react';
import { adminApi } from '@/lib/api/admin';
import { useServices } from '@/lib/hooks/useAdmin';
import type { Group } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/ErrorAlert';

export default function GroupsPage() {
  const router = useRouter();
  const { status } = useSession();
  const { data: services } = useServices();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [formName, setFormName] = useState('');
  const [formServiceIds, setFormServiceIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  const fetchGroups = async () => {
    try {
      const data = await adminApi.getGroups();
      setGroups(data);
    } catch {
      setError('Gagal memuat grup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchGroups();
  }, [status]);

  if (status !== 'authenticated') return null;

  const openCreate = () => {
    setEditGroup(null);
    setFormName('');
    setFormServiceIds([]);
    setModalOpen(true);
  };

  const openEdit = (g: Group) => {
    setEditGroup(g);
    setFormName(g.name);
    setFormServiceIds(g.serviceIds.map(s => s._id));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    setError('');
    try {
      if (editGroup) {
        await adminApi.updateGroup(editGroup._id, { name: formName, serviceIds: formServiceIds });
      } else {
        await adminApi.createGroup({ name: formName, serviceIds: formServiceIds });
      }
      setModalOpen(false);
      await fetchGroups();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan grup');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError('');
    try {
      await adminApi.deleteGroup(id);
      setDeleteId(null);
      await fetchGroups();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus grup');
    }
  };

  const toggleService = (id: string) => {
    setFormServiceIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Grup</h1>
            <p className="text-sm text-muted-foreground mt-1">Kelompokkan layanan</p>
          </div>
          <Button onClick={openCreate} className="rounded-xl">
            <IconPlus className="w-4 h-4 mr-2" />
            Buat Grup
          </Button>
        </div>

        <Separator />

        <ErrorAlert message={error} onClose={() => setError('')} />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-2xl p-4">
                <CardContent className="p-0">
                  <Skeleton className="h-5 w-32 mb-3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <IconLayoutKanban className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Belum ada grup</h3>
              <p className="text-sm text-muted-foreground mb-4">Kelompokkan layanan agar pelanggan mudah memilih</p>
              <Button onClick={openCreate} className="rounded-xl">
                <IconPlus className="w-4 h-4 mr-2" />
                Buat Grup
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {groups.map((g) => (
                <motion.div
                  key={g._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="rounded-2xl">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <IconGripVertical className="w-4 h-4 text-muted-foreground/40" />
                          <h3 className="font-semibold text-foreground">{g.name}</h3>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {g.serviceIds.length} layanan
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(g)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <IconPencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(g._id)}
                            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {g.serviceIds.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {g.serviceIds.map((s) => (
                            <span key={s._id} className="text-xs bg-muted text-foreground px-2.5 py-1 rounded-full">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Belum ada layanan di grup ini</p>
                      )}

                      {deleteId === g._id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3 pt-3 border-t border-border flex items-center gap-3"
                        >
                          <p className="text-sm text-muted-foreground">Hapus grup ini?</p>
                          <button
                            onClick={() => handleDelete(g._id)}
                            className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:opacity-90 transition-all"
                          >
                            Hapus
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            className="px-3 py-1.5 bg-muted text-foreground text-xs font-medium rounded-lg hover:bg-muted/80 transition-colors"
                          >
                            Batal
                          </button>
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
                {editGroup ? 'Edit Grup' : 'Buat Grup'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nama Grup</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                  placeholder="Contoh: Makanan, Minuman"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Pilih Layanan ({formServiceIds.length} dipilih)
                </label>
                {services && services.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto space-y-1 border border-border rounded-xl p-2">
                    {services.map((s) => {
                      const selected = formServiceIds.includes(s._id);
                      return (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => toggleService(s._id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selected
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-foreground hover:bg-muted'
                          }`}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Belum ada layanan. Buat layanan dulu ya.</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !formName.trim()}
                  className="flex-1 rounded-xl"
                >
                  {saving && <IconLoader2 className="w-4 h-4 animate-spin mr-2" />}
                  Simpan
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
