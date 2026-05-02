'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit, RefreshCw, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => { fetchWarehouses(); }, []);

  async function fetchWarehouses() {
    setLoading(true);
    const { data } = await supabase.from('warehouses').select('*').order('name');
    setWarehouses(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error('الاسم مطلوب');
    if (editingId) {
      await supabase.from('warehouses').update({ name, description }).eq('id', editingId);
      toast.success('تم التحديث');
    } else {
      await supabase.from('warehouses').insert({ name, description });
      toast.success('تمت الإضافة');
    }
    setShowForm(false); setEditingId(null); setName(''); setDescription('');
    fetchWarehouses();
  }

  async function deleteWarehouse(id: string) {
    if (!confirm('حذف المستودع؟')) return;
    await supabase.from('warehouses').delete().eq('id', id);
    toast.success('تم الحذف');
    fetchWarehouses();
  }

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold text-white">إدارة المستودعات</h1>
          <button onClick={() => { setShowForm(true); setEditingId(null); setName(''); setDescription(''); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold"><Plus size={16} /> إضافة مستودع</button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-dark-100 p-6 rounded-xl border border-gray-800 space-y-4">
            <input type="text" placeholder="اسم المستودع" value={name} onChange={e=>setName(e.target.value)} required className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
            <input type="text" placeholder="الوصف" value={description} onChange={e=>setDescription(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
            <button type="submit" className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">{editingId ? 'تحديث' : 'إضافة'}</button>
          </form>
        )}
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : warehouses.length===0 ? <div className="text-center text-gray-400">لا توجد مستودعات</div> :
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warehouses.map(w=>(
              <div key={w.id} className="bg-dark-100 border border-gray-800 rounded-xl p-5">
                <div className="flex justify-between items-start">
                  <div><h3 className="text-lg font-bold text-white">{w.name}</h3><p className="text-gray-400 text-sm">{w.description}</p></div>
                  <div className="flex gap-2"><button onClick={()=>{ setEditingId(w.id); setName(w.name); setDescription(w.description||''); setShowForm(true); }} className="text-cyan-400"><Edit size={16} /></button><button onClick={()=>deleteWarehouse(w.id)} className="text-red-400"><Trash2 size={16} /></button></div>
                </div>
              </div>
            ))}
          </div>
        }
      </div>
    </AuthGuard>
  );
}