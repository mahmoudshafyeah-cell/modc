'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Power } from 'lucide-react';
import CashbackForm from './CashbackForm';

export default function CashbackPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/cashback', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRules(data.rules || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه القاعدة؟')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/cashback?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم الحذف');
      fetchRules();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/cashback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, is_active: !current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchRules();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">قواعد الكاش باك</h1>
        <button onClick={() => { setEditingRule(null); setFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white">
          <Plus size={16} /> إضافة قاعدة
        </button>
      </div>

      <div className="rounded-2xl bg-dark-100 border border-gray-700 overflow-x-auto">
        <table className="w-full text-right">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-4 text-gray-400">الاسم</th>
              <th className="p-4 text-gray-400">النوع</th>
              <th className="p-4 text-gray-400">النسبة</th>
              <th className="p-4 text-gray-400">الحد الأدنى</th>
              <th className="p-4 text-gray-400">الفئة المستهدفة</th>
              <th className="p-4 text-gray-400">الحالة</th>
              <th className="p-4 text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-b border-gray-800">
                <td className="p-4 text-white">{r.name}</td>
                <td className="p-4 text-gray-300">{r.type === 'deposit' ? 'إيداع' : 'شراء'}</td>
                <td className="p-4 text-white">{r.cashback_percent}%</td>
                <td className="p-4 text-gray-300">{r.min_amount ? `$${r.min_amount}` : '-'}</td>
                <td className="p-4 text-gray-300">{r.target_role === 'all' ? 'الجميع' : r.target_role === 'agent' ? 'الوكلاء' : 'العملاء'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-lg text-xs ${r.is_active ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {r.is_active ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingRule(r); setFormOpen(true); }} className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleToggle(r.id, r.is_active)} className={`p-1.5 rounded-lg ${r.is_active ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                      <Power size={14} />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg bg-red-600/20 text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rules.length === 0 && <p className="p-4 text-gray-400 text-center">لا توجد قواعد</p>}
      </div>

      <CashbackForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); fetchRules(); }}
        initialData={editingRule}
      />
    </div>
  );
}