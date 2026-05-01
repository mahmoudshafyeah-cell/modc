'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function CategoryForm({ open, onClose, onSuccess, initialData }: any) {
  const [form, setForm] = useState({ name: '', name_ar: '', icon: '📁', color: '#6C3AFF', sort_order: '0', is_active: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        name_ar: initialData.name_ar,
        icon: initialData.icon || '📁',
        color: initialData.color || '#6C3AFF',
        sort_order: initialData.sort_order?.toString() || '0',
        is_active: initialData.is_active,
      });
    } else {
      setForm({ name: '', name_ar: '', icon: '📁', color: '#6C3AFF', sort_order: '0', is_active: true });
    }
  }, [initialData, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const method = initialData ? 'PUT' : 'POST';
      const payload = initialData ? { id: initialData.id, ...form } : form;
      const res = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(initialData ? 'تم التحديث' : 'تمت الإضافة');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-dark-100 rounded-2xl p-6 w-full max-w-md border border-violet-500/30" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
          <h3 className="text-lg font-bold text-white">{initialData ? 'تعديل فئة' : 'إضافة فئة'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={form.name_ar} onChange={e => setForm({...form, name_ar: e.target.value})} placeholder="الاسم العربي" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="الاسم بالإنجليزية" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
          <input value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} placeholder="الأيقونة (emoji)" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
          <input value={form.color} onChange={e => setForm({...form, color: e.target.value})} type="color" className="w-full h-12 p-1 rounded-xl bg-dark-50 border border-gray-700" />
          <input value={form.sort_order} onChange={e => setForm({...form, sort_order: e.target.value})} type="number" placeholder="الترتيب" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
          <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> نشط</label>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold">{loading ? 'جاري الحفظ...' : initialData ? 'تحديث' : 'إضافة'}</button>
        </form>
      </div>
    </div>
  );
}