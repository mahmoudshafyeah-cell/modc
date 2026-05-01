'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function CashbackForm({ open, onClose, onSuccess, initialData }: any) {
  const [form, setForm] = useState({
    name: '',
    type: 'deposit',
    cashback_percent: '',
    min_amount: '',
    max_cashback: '',
    target_role: 'all',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        type: initialData.type,
        cashback_percent: initialData.cashback_percent.toString(),
        min_amount: initialData.min_amount?.toString() || '',
        max_cashback: initialData.max_cashback?.toString() || '',
        target_role: initialData.target_role || 'all',
        is_active: initialData.is_active,
      });
    } else {
      setForm({ name: '', type: 'deposit', cashback_percent: '', min_amount: '', max_cashback: '', target_role: 'all', is_active: true });
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
      const res = await fetch('/api/admin/cashback', {
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
          <h3 className="text-lg font-bold text-white">{initialData ? 'تعديل قاعدة' : 'إضافة قاعدة كاش باك'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="اسم القاعدة" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white">
            <option value="deposit">إيداع</option>
            <option value="purchase">شراء</option>
          </select>
          <input value={form.cashback_percent} onChange={e => setForm({...form, cashback_percent: e.target.value})} type="number" step="0.01" placeholder="نسبة الكاش باك (%)" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
          <input value={form.min_amount} onChange={e => setForm({...form, min_amount: e.target.value})} type="number" step="0.01" placeholder="الحد الأدنى للمبلغ (اختياري)" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
          <input value={form.max_cashback} onChange={e => setForm({...form, max_cashback: e.target.value})} type="number" step="0.01" placeholder="الحد الأقصى للكاش باك (اختياري)" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
          <select value={form.target_role} onChange={e => setForm({...form, target_role: e.target.value})} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white">
            <option value="all">الجميع</option>
            <option value="customer">العملاء فقط</option>
            <option value="agent">الوكلاء فقط</option>
          </select>
          <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> نشط</label>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold">{loading ? 'جاري الحفظ...' : initialData ? 'تحديث' : 'إضافة'}</button>
        </form>
      </div>
    </div>
  );
}