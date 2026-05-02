'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit, RefreshCw, Shield, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'employee' });
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('warehouse_users')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false });
    if (error) toast.error('فشل جلب المستخدمين');
    else setUsers(data || []);
    setLoading(false);
  }

  async function fetchRoles() {
    const { data } = await supabase.from('roles').select('id, name');
    setRoles(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim()) return toast.error('البريد الإلكتروني مطلوب');
    if (!editingId && !form.password) return toast.error('كلمة المرور مطلوبة للمستخدم الجديد');

    const payload: any = {
      email: form.email,
      full_name: form.full_name,
      role: form.role,
    };
    if (!editingId) {
      const hashedPassword = await bcrypt.hash(form.password, 10);
      payload.password_hash = hashedPassword;
    }

    if (editingId) {
      const { error } = await supabase.from('warehouse_users').update(payload).eq('id', editingId);
      if (error) toast.error('فشل التحديث');
      else toast.success('تم تحديث المستخدم');
    } else {
      const { error } = await supabase.from('warehouse_users').insert(payload);
      if (error) toast.error('فشل الإضافة');
      else toast.success('تمت إضافة المستخدم');
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ email: '', full_name: '', password: '', role: 'employee' });
    fetchUsers();
  }

  async function deleteUser(id: string) {
    if (!confirm('حذف هذا المستخدم؟')) return;
    const { error } = await supabase.from('warehouse_users').delete().eq('id', id);
    if (error) toast.error('فشل الحذف');
    else toast.success('تم الحذف');
    fetchUsers();
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">المستخدمين (المستودع)</h1>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ email: '', full_name: '', password: '', role: 'employee' }); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold"
          >
            <Plus size={16} /> إضافة مستخدم
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-dark-100 rounded-xl p-6 border border-gray-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="email" placeholder="البريد الإلكتروني" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="p-2 rounded-lg bg-gray-800 text-white border border-gray-700" />
              <input type="text" placeholder="الاسم الكامل" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="p-2 rounded-lg bg-gray-800 text-white border border-gray-700" />
              {!editingId && (
                <input type="password" placeholder="كلمة المرور" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required className="p-2 rounded-lg bg-gray-800 text-white border border-gray-700" />
              )}
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="p-2 rounded-lg bg-gray-800 text-white border border-gray-700">
                <option value="employee">موظف</option>
                <option value="admin">مدير</option>
                <option value="super_admin">مدير عام</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">{editingId ? 'تحديث' : 'إضافة'}</button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد مستخدمين</div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-3 text-right">البريد</th>
                  <th className="p-3 text-right">الاسم</th>
                  <th className="p-3 text-right">الدور</th>
                  <th className="p-3 text-right">تاريخ التسجيل</th>
                  <th className="p-3 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{u.email}</td>
                    <td className="p-3 text-gray-300">{u.full_name || '-'}</td>
                    <td className="p-3 text-gray-300">{u.role}</td>
                    <td className="p-3 text-gray-300">{new Date(u.created_at).toLocaleDateString('ar-SY')}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => { setEditingId(u.id); setForm({ email: u.email, full_name: u.full_name || '', password: '', role: u.role }); setShowForm(true); }} className="text-cyan-400"><Edit size={16} /></button>
                      <button onClick={() => deleteUser(u.id)} className="text-red-400"><Trash2 size={16} /></button>
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