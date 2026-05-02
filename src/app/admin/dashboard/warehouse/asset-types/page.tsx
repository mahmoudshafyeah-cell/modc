'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AssetTypesPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');

  useEffect(() => { fetchTypes(); }, []);

  async function fetchTypes() {
    setLoading(true);
    const { data } = await supabase.from('asset_types').select('*').order('name');
    setTypes(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error('الاسم مطلوب');
    if (editingId) {
      await supabase.from('asset_types').update({ name }).eq('id', editingId);
      toast.success('تم التحديث');
    } else {
      await supabase.from('asset_types').insert({ name });
      toast.success('تمت الإضافة');
    }
    setShowForm(false); setEditingId(null); setName('');
    fetchTypes();
  }

  async function deleteType(id: string) {
    if (!confirm('حذف النوع؟')) return;
    await supabase.from('asset_types').delete().eq('id', id);
    toast.success('تم الحذف');
    fetchTypes();
  }

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold text-white">أنواع الأصول</h1>
          <button onClick={() => { setShowForm(true); setEditingId(null); setName(''); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold"><Plus size={16} /> إضافة نوع</button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-dark-100 p-6 rounded-xl border border-gray-800 space-y-4">
            <input type="text" placeholder="اسم النوع (مثال: كود، بطاقة، شحن)" value={name} onChange={e=>setName(e.target.value)} required className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
            <button type="submit" className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">{editingId ? 'تحديث' : 'إضافة'}</button>
          </form>
        )}
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : types.length===0 ? <div className="text-center text-gray-400">لا توجد أنواع</div> :
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700"><tr><th className="p-3 text-right">النوع</th><th className="p-3 text-right">الإجراءات</th></tr></thead>
              <tbody>
                {types.map(t=>(
                  <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{t.name}</td>
                    <td className="p-3 flex gap-2"><button onClick={()=>{ setEditingId(t.id); setName(t.name); setShowForm(true); }} className="text-cyan-400"><Edit size={16} /></button><button onClick={()=>deleteType(t.id)} className="text-red-400"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </AuthGuard>
  );
}