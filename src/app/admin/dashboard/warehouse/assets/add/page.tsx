'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AddAssetPage() {
  const router = useRouter();
  const [form, setForm] = useState({ product_id: '', type: '', data: '{}', status: 'available', owner_id: 'system' });
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('products').select('id,name').then(({data}) => setProducts(data||[]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let parsedData;
    try { parsedData = JSON.parse(form.data); } catch { toast.error('JSON غير صالح'); return; }
    const { error } = await supabase.from('assets').insert({ ...form, data: parsedData });
    if (error) toast.error('فشل الإضافة: '+error.message);
    else { toast.success('تمت إضافة الأصل'); router.push('/dashboard/warehouse/assets'); }
  }

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">إضافة أصل جديد</h1>
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
          <div><label className="block text-white mb-1">المالك (البريد أو system)</label><input type="text" value={form.owner_id} onChange={e=>setForm({...form, owner_id: e.target.value})} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" /></div>
          <button type="submit" className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">حفظ</button>
        </form>
      </div>
    </AuthGuard>
  );
}