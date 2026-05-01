// المسار: src/app/dashboard/VipLevelsManager.tsx
'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, X, CheckCircle, Crown, TrendingUp, DollarSign, Percent } from 'lucide-react';

interface VipLevel {
  id: string;
  name: string;
  min_deposit: number;
  max_deposit: number | null;
  commission_rate: number;
  discount_rate: number;
  color: string;
}

export default function VipLevelsManager() {
  const [levels, setLevels] = useState<VipLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VipLevel | null>(null);
  const [form, setForm] = useState({
    name: '',
    min_deposit: '',
    max_deposit: '',
    commission_rate: '',
    discount_rate: '',
    color: '#0c71b2',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchLevels(); }, []);

  async function fetchLevels() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/vip-levels', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setLevels(data.levels || []);
      else toast.error(data.error || 'فشل جلب المستويات');
    } catch (error) {
      toast.error('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', min_deposit: '', max_deposit: '', commission_rate: '', discount_rate: '', color: '#0c71b2' });
    setFormOpen(true);
  };

  const openEdit = (level: VipLevel) => {
    setEditing(level);
    setForm({
      name: level.name,
      min_deposit: level.min_deposit.toString(),
      max_deposit: level.max_deposit?.toString() || '',
      commission_rate: level.commission_rate.toString(),
      discount_rate: level.discount_rate.toString(),
      color: level.color,
    });
    setFormOpen(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.min_deposit) return toast.error('الاسم والحد الأدنى مطلوبان');
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const method = editing ? 'PUT' : 'POST';
      const payload = {
        ...(editing ? { id: editing.id } : {}),
        name: form.name,
        min_deposit: parseFloat(form.min_deposit),
        max_deposit: form.max_deposit ? parseFloat(form.max_deposit) : null,
        commission_rate: parseFloat(form.commission_rate) || 0,
        discount_rate: parseFloat(form.discount_rate) || 0,
        color: form.color,
      };

      const res = await fetch('/api/admin/vip-levels', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ');
      toast.success(editing ? 'تم التحديث' : 'تمت الإضافة');
      setFormOpen(false);
      fetchLevels();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا المستوى؟')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/vip-levels?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم الحذف');
      fetchLevels();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">مستويات VIP</h2>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white">
          <Plus size={16} /> إضافة مستوى
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {levels.map(level => (
          <div key={level.id} className="rounded-2xl p-5" style={{ background: '#111128', border: `1px solid ${level.color}30` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown size={20} style={{ color: level.color }} />
                <h3 className="font-bold text-white text-lg">{level.name}</h3>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(level)} className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(level.id)} className="p-1.5 rounded-lg bg-red-600/20 text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">نطاق الإيداع</span>
                <span className="text-white">
                  ${level.min_deposit} - {level.max_deposit ? `$${level.max_deposit}` : '∞'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">نسبة العمولة</span>
                <span className="text-green-400">{level.commission_rate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">نسبة الخصم</span>
                <span className="text-cyan-400">{level.discount_rate}%</span>
              </div>
            </div>
          </div>
        ))}
        {levels.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">لا توجد مستويات</p>}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setFormOpen(false)}>
          <div className="bg-dark-100 rounded-2xl p-6 w-full max-w-md border border-violet-500/30" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              <h3 className="text-lg font-bold text-white">{editing ? 'تعديل مستوى' : 'إضافة مستوى'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="اسم المستوى" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
              <input value={form.min_deposit} onChange={e => setForm({...form, min_deposit: e.target.value})} type="number" step="0.01" placeholder="الحد الأدنى للإيداع ($)" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
              <input value={form.max_deposit} onChange={e => setForm({...form, max_deposit: e.target.value})} type="number" step="0.01" placeholder="الحد الأقصى (اختياري)" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
              <input value={form.commission_rate} onChange={e => setForm({...form, commission_rate: e.target.value})} type="number" step="0.1" placeholder="نسبة العمولة %" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
              <input value={form.discount_rate} onChange={e => setForm({...form, discount_rate: e.target.value})} type="number" step="0.1" placeholder="نسبة الخصم %" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
              <div>
                <label className="text-white text-sm block mb-1">اللون</label>
                <input value={form.color} onChange={e => setForm({...form, color: e.target.value})} type="color" className="w-full h-10 rounded-xl" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold">{saving ? 'جاري...' : editing ? 'تحديث' : 'إضافة'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}