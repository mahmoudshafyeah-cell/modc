'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function CouponForm({ open, onClose, onSuccess, initialData }: any) {
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: '',
    min_order_amount: '',
    max_uses: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        code: initialData.code,
        discount_type: initialData.discount_type,
        discount_value: initialData.discount_value.toString(),
        min_order_amount: initialData.min_order_amount?.toString() || '',
        max_uses: initialData.max_uses?.toString() || '',
        valid_from: initialData.valid_from?.split('T')[0] || '',
        valid_until: initialData.valid_until?.split('T')[0] || '',
        is_active: initialData.is_active,
      });
    } else {
      setForm({ code: '', discount_type: 'percent', discount_value: '', min_order_amount: '', max_uses: '', valid_from: '', valid_until: '', is_active: true });
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
      const res = await fetch('/api/admin/coupons', {
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
          <h3 className="text-lg font-bold text-white">{initialData ? 'تعديل كوبون' : 'إضافة كوبون'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="كود الكوبون" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
          <select value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white">
            <option value="percent">نسبة مئوية (%)</option>
            <option value="fixed">مبلغ ثابت ($)</option>
          </select>
          <input value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})} type="number" step="0.01" placeholder={form.discount_type === 'percent' ? 'نسبة الخصم' : 'مبلغ الخصم'} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
          <input value={form.min_order_amount} onChange={e => setForm({...form, min_order_amount: e.target.value})} type="number" step="0.01" placeholder="الحد الأدنى للطلب (اختياري)" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
          <input value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})} type="number" placeholder="الحد الأقصى للاستخدام (اختياري)" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.valid_from} onChange={e => setForm({...form, valid_from: e.target.value})} type="date" placeholder="من" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
            <input value={form.valid_until} onChange={e => setForm({...form, valid_until: e.target.value})} type="date" placeholder="إلى" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
          </div>
          <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> نشط</label>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold">{loading ? 'جاري الحفظ...' : initialData ? 'تحديث' : 'إضافة'}</button>
        </form>
      </div>
    </div>
  );
}