'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

export default function EditAssetPage() {
  const router = useRouter();
  const { id } = useParams();
  const [form, setForm] = useState({ product_id: '', type: '', data: '{}', status: 'available', owner_id: '' });
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('products').select('id,name').then(({data}) => setProducts(data||[]));
    supabase.from('assets').select('*').eq('id', id).single().then(({data}) => {
      if (data) setForm({ product_id: data.product_id, type: data.type, data: JSON.stringify(data.data, null, 2), status: data.status, owner_id: data.owner_id });
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let parsedData;
    try { parsedData = JSON.parse(form.data); } catch { toast.error('JSON غير صالح'); return; }
    const { error } = await supabase.from('assets').update({ ...form, data: parsedData }).eq('id', id);
    if (error) toast.error('فشل التحديث');
    else { toast.success('تم التحديث'); router.push('/dashboard/warehouse/assets'); }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div>;

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">تعديل الأصل</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-dark-100 p-6 rounded-xl border border-gray-800">
          <div><label className="block text-white mb-1">المنتج</label>
            <select value={form.product_id} onChange={e=>setForm({...form, product_id: e.target.value})} required className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700">
              <option value="">اختر المنتج</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div><label className="block text-white mb-1">النوع</label><input type="text" value={form.type} onChange={e=>setForm({...form, type: e.target.value})} required className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" /></div>
          <div><label className="block text-white mb-1">البيانات (JSON)</label><textarea value={form.data} onChange={e=>setForm({...form, data: e.target.value})} rows={5} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 font-mono text-sm" /></div>
          <div><label className="block text-white mb-1">الحالة</label>
            <select value={form.status} onChange={e=>setForm({...form, status: e.target.value})} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700">
              <option value="available">متاح</option><option value="reserved">محجوز</option><option value="sold">مباع</option><option value="expired">منتهي</option>
            </select>
          </div>
          <div><label className="block text-white mb-1">المالك</label><input type="text" value={form.owner_id} onChange={e=>setForm({...form, owner_id: e.target.value})} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" /></div>
          <button type="submit" className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">تحديث</button>
        </form>
      </div>
    </AuthGuard>
  );
}