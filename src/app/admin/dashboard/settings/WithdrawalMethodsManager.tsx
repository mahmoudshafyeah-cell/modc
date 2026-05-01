'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, Edit2, Trash2, Power } from 'lucide-react';

interface WithdrawalMethod {
  id: string;
  name: string;
  type: 'manual' | 'local' | 'crypto';
  instructions: string | null;
  is_active: boolean;
  requires_proof: boolean;
  wallet_address?: string;
  min_amount?: number;
  fee_percent?: number;
  is_automatic?: boolean;
}

export default function WithdrawalMethodsManager() {
  const [methods, setMethods] = useState<WithdrawalMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<WithdrawalMethod | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'manual' as const,
    instructions: '',
    is_active: true,
    requires_proof: true,
    wallet_address: '',
    min_amount: '',
    fee_percent: '',
    is_automatic: false,
  });

  useEffect(() => {
    fetchMethods();
  }, []);

  async function fetchMethods() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/withdrawal-methods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب طرق السحب');
      setMethods(data.methods || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  const openAddForm = () => {
    setEditingMethod(null);
    setForm({
      name: '',
      type: 'manual',
      instructions: '',
      is_active: true,
      requires_proof: true,
      wallet_address: '',
      min_amount: '',
      fee_percent: '',
      is_automatic: false,
    });
    setFormOpen(true);
  };

  const openEditForm = (method: WithdrawalMethod) => {
    setEditingMethod(method);
    setForm({
      name: method.name,
      type: method.type,
      instructions: method.instructions || '',
      is_active: method.is_active,
      requires_proof: method.requires_proof,
      wallet_address: method.wallet_address || '',
      min_amount: method.min_amount?.toString() || '',
      fee_percent: method.fee_percent?.toString() || '',
      is_automatic: method.is_automatic || false,
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('الاسم مطلوب');
    try {
      const token = localStorage.getItem('auth_token');
      const method = editingMethod ? 'PUT' : 'POST';
      
      const body = {
        name: form.name,
        type: form.type,
        instructions: form.instructions,
        is_active: form.is_active,
        requires_proof: form.requires_proof,
        wallet_address: form.wallet_address || null,
        is_automatic: form.is_automatic,
        min_amount: form.min_amount && form.min_amount.trim() !== '' ? parseFloat(form.min_amount) : null,
        fee_percent: form.fee_percent && form.fee_percent.trim() !== '' ? parseFloat(form.fee_percent) : null,
      };
      
      const payload = editingMethod ? { id: editingMethod.id, ...body } : body;
      
      const res = await fetch('/api/admin/withdrawal-methods', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ');
      toast.success(editingMethod ? 'تم التحديث' : 'تمت الإضافة');
      setFormOpen(false);
      fetchMethods();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/withdrawal-methods', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, is_active: !current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحديث');
      fetchMethods();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف طريقة السحب هذه؟')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/withdrawal-methods?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      toast.success('تم الحذف');
      fetchMethods();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700"
        >
          <Plus size={16} /> إضافة طريقة سحب
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.map((m) => (
          <div key={m.id} className="rounded-xl p-4 bg-dark-100 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(m.id, m.is_active)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    m.is_active ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  <Power size={14} />
                </button>
                <span className="font-bold text-white">{m.name}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEditForm(m)}
                  className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-1.5 rounded-lg bg-red-600/20 text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {m.instructions && <p className="text-xs text-gray-400 mt-2">{m.instructions}</p>}
            <div className="flex gap-3 mt-3 text-xs">
              <span
                className={`px-2 py-0.5 rounded ${
                  m.is_active ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'
                }`}
              >
                {m.is_active ? 'مفعل' : 'معطل'}
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-400">
                {m.type === 'manual' ? 'يدوي' : m.type === 'local' ? 'محلي' : 'رقمي'}
              </span>
              {m.is_automatic && (
                <span className="px-2 py-0.5 rounded bg-purple-600/20 text-purple-400">
                  تلقائي
                </span>
              )}
              {m.fee_percent !== undefined && (
                <span className="px-2 py-0.5 rounded bg-yellow-600/20 text-yellow-400">
                  رسوم {m.fee_percent}%
                </span>
              )}
            </div>
          </div>
        ))}
        {methods.length === 0 && <p className="text-gray-400 col-span-2 text-center py-8">لا توجد طرق سحب</p>}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setFormOpen(false)}>
          <div
            className="bg-dark-100 rounded-2xl p-6 w-full max-w-md border border-violet-500/30 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
              <h3 className="text-lg font-bold text-white">
                {editingMethod ? 'تعديل طريقة سحب' : 'إضافة طريقة سحب'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="الاسم"
                className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
                required
              />
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
              >
                <option value="manual">يدوي</option>
                <option value="local">محلي</option>
                <option value="crypto">رقمي</option>
              </select>
              <textarea
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="تعليمات"
                className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
                rows={2}
              />
              {form.type === 'crypto' && (
                <>
                  <input
                    value={form.wallet_address}
                    onChange={(e) => setForm({ ...form, wallet_address: e.target.value })}
                    placeholder="عنوان المحفظة"
                    className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
                  />
                  <input
                    value={form.min_amount}
                    onChange={(e) => setForm({ ...form, min_amount: e.target.value })}
                    type="number"
                    step="0.01"
                    placeholder="الحد الأدنى (USD)"
                    className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
                  />
                </>
              )}
              <input
                value={form.fee_percent}
                onChange={(e) => setForm({ ...form, fee_percent: e.target.value })}
                type="number"
                step="0.01"
                placeholder="رسوم السحب (%)"
                className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
              />
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={form.is_automatic}
                  onChange={(e) => setForm({ ...form, is_automatic: e.target.checked })}
                />{' '}
                تلقائي (للعملات الرقمية)
              </label>
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />{' '}
                مفعلة
              </label>
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={form.requires_proof}
                  onChange={(e) => setForm({ ...form, requires_proof: e.target.checked })}
                />{' '}
                تتطلب إثبات
              </label>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700"
              >
                {editingMethod ? 'تحديث' : 'إضافة'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}