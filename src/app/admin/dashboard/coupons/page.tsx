'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number;
  used_count: number;
  valid_until: string;
  is_active: boolean;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Coupon>>({
    code: '', discount_type: 'percent', discount_value: 10, min_order_amount: 0, max_uses: 100, valid_until: '', is_active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    setLoading(true);
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code) return toast.error('كود الكوبون مطلوب');
    const payload = { ...form };
    if (editingId) {
      const { error } = await supabase.from('coupons').update(payload).eq('id', editingId);
      if (error) toast.error('فشل التحديث');
      else toast.success('تم التحديث');
    } else {
      const { error } = await supabase.from('coupons').insert(payload);
      if (error) toast.error('فشل الإضافة');
      else toast.success('تمت الإضافة');
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ code: '', discount_type: 'percent', discount_value: 10, min_order_amount: 0, max_uses: 100, valid_until: '', is_active: true });
    fetchCoupons();
  }

  async function deleteCoupon(id: string) {
    if (!confirm('حذف هذا الكوبون؟')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) toast.error('فشل الحذف');
    else toast.success('تم الحذف');
    fetchCoupons();
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">الكوبونات والعروض</h1>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ code: '', discount_type: 'percent', discount_value: 10, min_order_amount: 0, max_uses: 100, valid_until: '', is_active: true }); }} className="px-4 py-2 rounded-xl bg-cyan-600 text-white flex items-center gap-2"><Plus size={16} /> إضافة كوبون</button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-dark-100 rounded-xl p-6 border border-gray-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="الكود" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required className="p-2 rounded bg-gray-800 text-white border border-gray-700" />
              <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value as any })} className="p-2 rounded bg-gray-800 text-white border border-gray-700"><option value="percent">نسبة مئوية</option><option value="fixed">قيمة ثابتة</option></select>
              <input type="number" step="0.01" placeholder="قيمة الخصم" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} className="p-2 rounded bg-gray-800 text-white border border-gray-700" />
              <input type="number" placeholder="الحد الأدنى للطلب" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: parseFloat(e.target.value) || 0 })} className="p-2 rounded bg-gray-800 text-white border border-gray-700" />
              <input type="number" placeholder="الاستخدامات القصوى" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: parseInt(e.target.value) || 0 })} className="p-2 rounded bg-gray-800 text-white border border-gray-700" />
              <input type="date" placeholder="تاريخ الانتهاء" value={form.valid_until?.split('T')[0]} onChange={e => setForm({ ...form, valid_until: e.target.value })} className="p-2 rounded bg-gray-800 text-white border border-gray-700" />
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" /><span className="text-white">نشط</span></label>
            </div>
            <button type="submit" className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">{editingId ? 'تحديث' : 'إضافة'}</button>
          </form>
        )}
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : coupons.length === 0 ? <div className="text-center py-20 text-gray-400">لا توجد كوبونات</div> : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr><th className="p-3 text-right">الكود</th><th className="p-3 text-right">الخصم</th><th className="p-3 text-right">الحد الأدنى</th><th className="p-3 text-right">الاستخدامات</th><th className="p-3 text-right">صلاحيته</th><th className="p-3 text-right">نشط</th><th className="p-3 text-right"></th></tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300 font-mono">{c.code}</td><td className="p-3">{c.discount_type === 'percent' ? `${c.discount_value}%` : `$${c.discount_value}`}</td>
                    <td className="p-3">${c.min_order_amount}</td><td className="p-3">{c.used_count} / {c.max_uses}</td>
                    <td className="p-3">{c.valid_until ? new Date(c.valid_until).toLocaleDateString('ar-SY') : 'دائم'}</td><td className="p-3">{c.is_active ? '✅' : '❌'}</td>
                    <td className="p-3 flex gap-2"><button onClick={() => { setEditingId(c.id); setForm(c); setShowForm(true); }} className="text-cyan-400"><Edit size={16} /></button><button onClick={() => deleteCoupon(c.id)} className="text-red-400"><Trash2 size={16} /></button></td>
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