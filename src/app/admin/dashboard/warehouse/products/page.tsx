'use client';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Upload, Globe } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', image_url: '' });

  const fetchProducts = async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error('الاسم مطلوب');
    const supabase = getSupabase();
    const payload = { name: form.name, description: form.description, price: parseFloat(form.price) || 0, image_url: form.image_url };
    if (editingId) {
      await supabase.from('products').update(payload).eq('id', editingId);
      toast.success('تم التحديث');
    } else {
      await supabase.from('products').insert(payload);
      toast.success('تمت الإضافة');
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', description: '', price: '', image_url: '' });
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('حذف المنتج؟')) return;
    const supabase = getSupabase();
    await supabase.from('products').delete().eq('id', id);
    toast.success('تم الحذف');
    fetchProducts();
  };

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold text-white">المنتجات المحلية</h1>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white"><Plus size={16} /> إضافة منتج</button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-dark-100 p-6 rounded-xl border border-gray-800 space-y-4">
            <input type="text" placeholder="الاسم" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full p-2 rounded bg-gray-800" />
            <input type="text" placeholder="الوصف" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-2 rounded bg-gray-800" />
            <input type="number" step="0.01" placeholder="السعر" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full p-2 rounded bg-gray-800" />
            <input type="text" placeholder="رابط الصورة" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="w-full p-2 rounded bg-gray-800" />
            <button type="submit" className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">{editingId ? 'تحديث' : 'إضافة'}</button>
          </form>
        )}
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : products.length === 0 ? <div className="text-center text-gray-400">لا توجد منتجات</div> : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700"><tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">السعر</th><th className="p-3 text-right">الإجراءات</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{p.name}</td>
                    <td className="p-3 text-gray-300">${p.price}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => { setEditingId(p.id); setForm({ name: p.name, description: p.description || '', price: p.price, image_url: p.image_url || '' }); setShowForm(true); }} className="text-cyan-400"><Edit size={16} /></button>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-400"><Trash2 size={16} /></button>
                    </td>
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