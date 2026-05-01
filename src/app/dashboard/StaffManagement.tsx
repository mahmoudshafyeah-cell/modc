'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
  { id: 'manage_users', label: 'إدارة المستخدمين' },
  { id: 'manage_roles', label: 'إدارة الأدوار' },
  { id: 'approve_deposits', label: 'الموافقة على الإيداعات' },
  { id: 'manage_payment_methods', label: 'إدارة طرق الدفع' },
  { id: 'view_analytics', label: 'عرض التحليلات' },
  { id: 'manage_products', label: 'إدارة المنتجات' },
  { id: 'manage_orders', label: 'إدارة الطلبات' },
  { id: 'manage_settings', label: 'إعدادات النظام' },
];

export default function StaffManagement() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/staff', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب الموظفين');
      setStaff(data.staff || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  const openAddForm = () => {
    setEditingStaff(null);
    setForm({ full_name: '', email: '', password: '', permissions: [] });
    setFormOpen(true);
  };

  const openEditForm = (staffMember: any) => {
    setEditingStaff(staffMember);
    setForm({
      full_name: staffMember.full_name || '',
      email: staffMember.email || '',
      password: '',
      permissions: staffMember.permissions || [],
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email) {
      toast.error('الاسم والبريد الإلكتروني مطلوبان');
      return;
    }
    if (!editingStaff && !form.password) {
      toast.error('كلمة المرور مطلوبة للموظف الجديد');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/staff', {
        method: editingStaff ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: editingStaff?.user_id,
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          permissions: form.permissions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل العملية');
      toast.success(editingStaff ? 'تم تحديث الموظف' : 'تم إضافة الموظف');
      setFormOpen(false);
      fetchStaff();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟ سيتم تحويله إلى مستخدم عادي.')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/staff?userId=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      toast.success('تم حذف الموظف');
      fetchStaff();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">الموظفون</h2>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700"
        >
          <Plus size={16} /> إضافة موظف
        </button>
      </div>

      <div className="rounded-2xl bg-dark-100 border border-violet-500/20 overflow-x-auto">
        <table className="w-full text-right">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-4 text-gray-400">الاسم</th>
              <th className="p-4 text-gray-400">البريد الإلكتروني</th>
              <th className="p-4 text-gray-400">الصلاحيات</th>
              <th className="p-4 text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.user_id} className="border-b border-gray-800">
                <td className="p-4 text-white">{s.full_name || '-'}</td>
                <td className="p-4 text-gray-300" dir="ltr">{s.email}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {s.permissions?.map((p: string) => (
                      <span key={p} className="px-2 py-0.5 rounded bg-violet-600/20 text-violet-400 text-xs">
                        {AVAILABLE_PERMISSIONS.find((ap) => ap.id === p)?.label || p}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEditForm(s)} className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(s.user_id)} className="p-1.5 rounded-lg bg-red-600/20 text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {staff.length === 0 && <p className="p-4 text-gray-400 text-center">لا يوجد موظفون</p>}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setFormOpen(false)}>
          <div
            className="bg-dark-100 rounded-2xl p-6 w-full max-w-md border border-violet-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
              <h3 className="text-lg font-bold text-white">{editingStaff ? 'تعديل موظف' : 'إضافة موظف جديد'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="الاسم الكامل"
                className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
                required
              />
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="email"
                placeholder="البريد الإلكتروني"
                className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
                required
                disabled={!!editingStaff}
              />
              {!editingStaff && (
                <input
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  type="password"
                  placeholder="كلمة المرور"
                  className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
                  required
                />
              )}
              <div>
                <label className="text-white block mb-2">الصلاحيات</label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-dark-50 rounded-xl border border-gray-700">
                  {AVAILABLE_PERMISSIONS.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, permissions: [...form.permissions, p.id] });
                          } else {
                            setForm({ ...form, permissions: form.permissions.filter((id) => id !== p.id) });
                          }
                        }}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700">
                {editingStaff ? 'تحديث' : 'إضافة'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}