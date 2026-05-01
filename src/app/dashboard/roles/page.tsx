'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Save, Trash2, Edit, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

interface Role {
  id: string;
  name: string;
  created_at: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  async function fetchRoles() {
    const { data } = await supabase.from('roles').select('*').order('name');
    setRoles(data || []);
    setLoading(false);
  }

  async function fetchPermissions() {
    const { data } = await supabase.from('permissions').select('*').order('name');
    setPermissions(data || []);
  }

  async function fetchRolePermissions(roleId: string) {
    const { data } = await supabase.from('role_permissions').select('permission_id').eq('role_id', roleId);
    setRolePermissions(new Set(data?.map(rp => rp.permission_id) || []));
  }

  const selectRole = (role: Role) => {
    setSelectedRole(role);
    setRoleName(role.name);
    fetchRolePermissions(role.id);
  };

  const togglePermission = (permId: string) => {
    const newSet = new Set(rolePermissions);
    if (newSet.has(permId)) newSet.delete(permId);
    else newSet.add(permId);
    setRolePermissions(newSet);
  };

  const saveRolePermissions = async () => {
    if (!selectedRole) return;
    await supabase.from('role_permissions').delete().eq('role_id', selectedRole.id);
    if (rolePermissions.size > 0) {
      const inserts = Array.from(rolePermissions).map(permId => ({ role_id: selectedRole.id, permission_id: permId }));
      const { error } = await supabase.from('role_permissions').insert(inserts);
      if (error) toast.error('فشل حفظ الصلاحيات');
      else toast.success('تم حفظ الصلاحيات');
    } else {
      toast.success('تم مسح جميع الصلاحيات');
    }
  };

  const updateRoleName = async () => {
    if (!selectedRole || !roleName.trim()) return;
    const { error } = await supabase.from('roles').update({ name: roleName }).eq('id', selectedRole.id);
    if (error) toast.error('فشل تحديث الاسم');
    else {
      toast.success('تم تحديث الاسم');
      setSelectedRole({ ...selectedRole, name: roleName });
      fetchRoles();
    }
  };

  const createRole = async () => {
    const { data, error } = await supabase.from('roles').insert({ name: 'دور جديد' }).select().single();
    if (error) toast.error('فشل إنشاء الدور');
    else {
      toast.success('تم إنشاء الدور');
      fetchRoles();
      selectRole(data);
    }
  };

  const deleteRole = async (id: string) => {
    if (!confirm('حذف هذا الدور؟')) return;
    await supabase.from('role_permissions').delete().eq('role_id', id);
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) toast.error('فشل الحذف');
    else {
      toast.success('تم الحذف');
      if (selectedRole?.id === id) setSelectedRole(null);
      fetchRoles();
    }
  };

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">الأدوار والصلاحيات</h1>
          <button onClick={createRole} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold"><Plus size={16} /> إضافة دور</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* قائمة الأدوار */}
            <div className="bg-dark-100 rounded-xl border border-gray-800 p-4">
              <h2 className="text-lg font-bold text-white mb-3">الأدوار</h2>
              <ul className="space-y-2">
                {roles.map(role => (
                  <li key={role.id} className={`p-2 rounded-lg cursor-pointer flex justify-between items-center ${selectedRole?.id === role.id ? 'bg-cyan-600/20 border-r-2 border-cyan-400' : 'hover:bg-gray-800'}`}>
                    <span onClick={() => selectRole(role)} className="flex-1 text-white">{role.name}</span>
                    <button onClick={() => deleteRole(role.id)} className="text-red-400"><Trash2 size={14} /></button>
                  </li>
                ))}
              </ul>
            </div>

            {/* صلاحيات الدور المحدد */}
            <div className="md:col-span-2 bg-dark-100 rounded-xl border border-gray-800 p-4">
              {selectedRole ? (
                <>
                  <div className="flex gap-2 mb-4">
                    <input type="text" value={roleName} onChange={e => setRoleName(e.target.value)} className="flex-1 p-2 rounded-lg bg-gray-800 text-white border border-gray-700" />
                    <button onClick={updateRoleName} className="px-4 py-2 rounded-lg bg-cyan-600 text-white"><Save size={16} /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {permissions.map(perm => (
                      <label key={perm.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800">
                        <input type="checkbox" checked={rolePermissions.has(perm.id)} onChange={() => togglePermission(perm.id)} className="w-4 h-4" />
                        <span className="text-gray-300">{perm.description || perm.name}</span>
                      </label>
                    ))}
                  </div>
                  <button onClick={saveRolePermissions} className="mt-4 w-full py-2 rounded-xl bg-green-600 text-white font-bold">حفظ الصلاحيات</button>
                </>
              ) : (
                <p className="text-center text-gray-400 py-20">اختر دوراً من القائمة</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}