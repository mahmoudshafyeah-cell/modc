'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Power } from 'lucide-react';
import CouponForm from './CouponForm';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/coupons', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoupons(data.coupons || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم الحذف');
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, is_active: !current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">إدارة الكوبونات</h1>
        <button onClick={() => { setEditingCoupon(null); setFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white">
          <Plus size={16} /> إضافة كوبون
        </button>
      </div>

      <div className="rounded-2xl bg-dark-100 border border-gray-700 overflow-x-auto">
        <table className="w-full text-right">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-4 text-gray-400">الكود</th>
              <th className="p-4 text-gray-400">نوع الخصم</th>
              <th className="p-4 text-gray-400">القيمة</th>
              <th className="p-4 text-gray-400">الاستخدام</th>
              <th className="p-4 text-gray-400">الحالة</th>
              <th className="p-4 text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-gray-800">
                <td className="p-4 font-mono text-white">{c.code}</td>
                <td className="p-4 text-gray-300">{c.discount_type === 'percent' ? 'نسبة مئوية' : 'مبلغ ثابت'}</td>
                <td className="p-4 text-white">{c.discount_type === 'percent' ? `${c.discount_value}%` : `$${c.discount_value}`}</td>
                <td className="p-4 text-gray-300">{c.used_count} / {c.max_uses || '∞'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-lg text-xs ${c.is_active ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {c.is_active ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingCoupon(c); setFormOpen(true); }} className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleToggle(c.id, c.is_active)} className={`p-1.5 rounded-lg ${c.is_active ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                      <Power size={14} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg bg-red-600/20 text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && <p className="p-4 text-gray-400 text-center">لا توجد كوبونات</p>}
      </div>

      <CouponForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); fetchCoupons(); }}
        initialData={editingCoupon}
      />
    </div>
  );
}