'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  useEffect(() => { fetchCategories(); }, []);

  async function fetchCategories() {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error('الاسم مطلوب');
    if (editingId) {
      await supabase.from('categories').update({ name, icon }).eq('id', editingId);
      toast.success('تم التحديث');
    } else {
      await supabase.from('categories').insert({ name, icon });
      toast.success('تمت الإضافة');
    }
    setShowForm(false); setEditingId(null); setName(''); setIcon('');
    fetchCategories();
  }

  async function deleteCategory(id: string) {
    if (!confirm('حذف الفئة؟')) return;
    await supabase.from('categories').delete().eq('id', id);
    toast.success('تم الحذف');
    fetchCategories();
  }

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold text-white">فئات الأصول</h1>
          <button onClick={() => { setShowForm(true); setEditingId(null); setName(''); setIcon(''); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold"><Plus size={16} /> إضافة فئة</button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-dark-100 p-6 rounded-xl border border-gray-800 space-y-4">
            <input type="text" placeholder="اسم الفئة" value={name} onChange={e=>setName(e.target.value)} required className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
            <input type="text" placeholder="الأيقونة (اختياري)" value={icon} onChange={e=>setIcon(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
            <button type="submit" className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">{editingId ? 'تحديث' : 'إضافة'}</button>
          </form>
        )}
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : categories.length===0 ? <div className="text-center text-gray-400">لا توجد فئات</div> :
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700"><tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">الأيقونة</th><th className="p-3 text-right">الإجراءات</th></tr></thead>
              <tbody>
                {categories.map(c=>(
                  <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{c.name}</td><td className="p-3 text-gray-300">{c.icon || '-'}</td>
                    <td className="p-3 flex gap-2"><button onClick={()=>{ setEditingId(c.id); setName(c.name); setIcon(c.icon||''); setShowForm(true); }} className="text-cyan-400"><Edit size={16} /></button><button onClick={()=>deleteCategory(c.id)} className="text-red-400"><Trash2 size={16} /></button></td>
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