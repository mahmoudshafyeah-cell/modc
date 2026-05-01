'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Power } from 'lucide-react';
import BannerForm from './BannerForm';

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/banners', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBanners(data.banners || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا البنر؟')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم الحذف');
      fetchBanners();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, is_active: !current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchBanners();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">إدارة البنرات</h1>
        <button onClick={() => { setEditingBanner(null); setFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white">
          <Plus size={16} /> إضافة بنر
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.map((b) => (
          <div key={b.id} className="rounded-xl p-4 bg-dark-100 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggle(b.id, b.is_active)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${b.is_active ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                  <Power size={14} />
                </button>
                <span className="font-bold text-white">{b.title || 'بدون عنوان'}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingBanner(b); setFormOpen(true); }} className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg bg-red-600/20 text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {b.image_url && <img src={b.image_url} alt="معاينة" className="mt-3 rounded-lg max-h-32 object-cover w-full" />}
          </div>
        ))}
        {banners.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">لا توجد بنرات</p>}
      </div>

      <BannerForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); fetchBanners(); }}
        initialData={editingBanner}
      />
    </div>
  );
}