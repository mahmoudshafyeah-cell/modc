'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

interface VipLevel {
  id: string;
  name: string;
  min_deposit: number;
  commission_rate: number;
  discount_rate: number;
  color: string;
}

export default function VipLevelsPage() {
  const [levels, setLevels] = useState<VipLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', min_deposit: 0, commission_rate: 0, discount_rate: 0, color: '#0c71b2' });

  useEffect(() => {
    fetchLevels();
  }, []);

  async function fetchLevels() {
    setLoading(true);
    const { data } = await supabase.from('agent_vip_levels').select('*').order('min_deposit');
    setLevels(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return toast.error('الاسم مطلوب');
    const payload = { ...form };
    if (editingId) {
      const { error } = await supabase.from('agent_vip_levels').update(payload).eq('id', editingId);
      if (error) toast.error('فشل التحديث');
      else toast.success('تم التحديث');
    } else {
      const { error } = await supabase.from('agent_vip_levels').insert(payload);
      if (error) toast.error('فشل الإضافة');
      else toast.success('تمت الإضافة');
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', min_deposit: 0, commission_rate: 0, discount_rate: 0, color: '#0c71b2' });
    fetchLevels();
  }

  async function deleteLevel(id: string) {
    if (!confirm('حذف هذا المستوى؟')) return;
    const { error } = await supabase.from('agent_vip_levels').delete().eq('id', id);
    if (error) toast.error('فشل الحذف');
    else toast.success('تم الحذف');
    fetchLevels();
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">مستويات VIP للوكلاء</h1>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', min_deposit: 0, commission_rate: 0, discount_rate: 0, color: '#0c71b2' }); }} className="px-4 py-2 rounded-xl bg-cyan-600 text-white flex items-center gap-2"><Plus size={16} /> إضافة مستوى</button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-dark-100 rounded-xl p-6 border border-gray-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" placeholder="الاسم" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="p-2 rounded bg-gray-800 text-white border border-gray-700" />
              <input type="number" placeholder="الحد الأدنى للإيداع" value={form.min_deposit} onChange={e => setForm({ ...form, min_deposit: parseFloat(e.target.value) || 0 })} className="p-2 rounded bg-gray-800 text-white border border-gray-700" />
              <input type="number" step="0.1" placeholder="نسبة العمولة (%)" value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: parseFloat(e.target.value) || 0 })} className="p-2 rounded bg-gray-800 text-white border border-gray-700" />
              <input type="number" step="0.1" placeholder="نسبة الخصم (%)" value={form.discount_rate} onChange={e => setForm({ ...form, discount_rate: parseFloat(e.target.value) || 0 })} className="p-2 rounded bg-gray-800 text-white border border-gray-700" />
              <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-16 h-10 p-1 rounded bg-gray-800 border border-gray-700" />
            </div>
            <button type="submit" className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">{editingId ? 'تحديث' : 'إضافة'}</button>
          </form>
        )}
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : levels.length === 0 ? <div className="text-center py-20 text-gray-400">لا توجد مستويات</div> : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700"><tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">الحد الأدنى</th><th className="p-3 text-right">العمولة</th><th className="p-3 text-right">الخصم</th><th className="p-3 text-right">اللون</th><th className="p-3 text-right">الإجراءات</th></tr></thead>
              <tbody>
                {levels.map(l => (
                  <tr key={l.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{l.name}</td><td className="p-3 text-gray-300">${l.min_deposit}</td><td className="p-3 text-gray-300">{l.commission_rate}%</td><td className="p-3 text-gray-300">{l.discount_rate}%</td><td className="p-3"><div className="w-6 h-6 rounded-full" style={{ background: l.color }} /></td>
                    <td className="p-3 flex gap-2"><button onClick={() => { setEditingId(l.id); setForm(l); setShowForm(true); }} className="text-cyan-400"><Edit size={16} /></button><button onClick={() => deleteLevel(l.id)} className="text-red-400"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}