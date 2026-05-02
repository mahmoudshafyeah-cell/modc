'use client';
import { useEffect, useState } from 'react';
import { createAuthenticatedClient } from '@/lib/supabase';
import { Plus, Save, Trash2, Edit, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

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

  const fetchRoles = async () => {
    const supabase = createAuthenticatedClient();
    const { data, error } = await supabase.from('roles').select('*').order('name');
    if (error) {
      console.error('Error fetching roles:', error);
      toast.error('فشل جلب الأدوار');
    } else {
      setRoles(data || []);
    }
  };

  const fetchPermissions = async () => {
    const supabase = createAuthenticatedClient();
    const { data, error } = await supabase.from('permissions').select('*').order('name');
    if (error) {
      console.error('Error fetching permissions:', error);
      toast.error('فشل جلب الصلاحيات');
    } else {
      setPermissions(data || []);
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    const supabase = createAuthenticatedClient();
    const { data, error } = await supabase.from('role_permissions').select('permission_id').eq('role_id', roleId);
    if (error) {
      console.error('Error fetching role permissions:', error);
      setRolePermissions(new Set());
    } else {
      setRolePermissions(new Set(data?.map(rp => rp.permission_id) || []));
    }
  };

  useEffect(() => {
    Promise.all([fetchRoles(), fetchPermissions()]).finally(() => setLoading(false));
  }, []);

  const selectRole = async (role: Role) => {
    setSelectedRole(role);
    setRoleName(role.name);
    await fetchRolePermissions(role.id);
  };

  const saveRolePermissions = async () => {
    if (!selectedRole) return;
    const supabase = createAuthenticatedClient();
    // حذف الصلاحيات القديمة
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', selectedRole.id);
    if (deleteError) {
      toast.error('فشل تحديث الصلاحيات');
      return;
    }
    // إدراج الصلاحيات الجديدة
    if (rolePermissions.size > 0) {
      const inserts = Array.from(rolePermissions).map(permId => ({
        role_id: selectedRole.id,
        permission_id: permId,
      }));
      const { error: insertError } = await supabase.from('role_permissions').insert(inserts);
      if (insertError) {
        toast.error('فشل حفظ الصلاحيات');
        return;
      }
    }
    toast.success('تم حفظ الصلاحيات');
  };

  const updateRoleName = async () => {
    if (!selectedRole || !roleName.trim()) return;
    const supabase = createAuthenticatedClient();
    const { error } = await supabase.from('roles').update({ name: roleName }).eq('id', selectedRole.id);
    if (error) {
      toast.error('فشل تحديث اسم الدور');
    } else {
      toast.success('تم تحديث الاسم');
      setSelectedRole({ ...selectedRole, name: roleName });
      fetchRoles();
    }
  };

  const createRole = async () => {
    const supabase = createAuthenticatedClient();
    const { data, error } = await supabase.from('roles').insert({ name: 'دور جديد' }).select().single();
    if (error) {
      toast.error('فشل إنشاء الدور');
    } else {
      toast.success('تم إنشاء الدور');
      fetchRoles();
      if (data) selectRole(data);
    }
  };

  const deleteRole = async (id: string) => {
    if (!confirm('حذف هذا الدور؟')) return;
    const supabase = createAuthenticatedClient();
    await supabase.from('role_permissions').delete().eq('role_id', id);
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) {
      toast.error('فشل حذف الدور');
    } else {
      toast.success('تم حذف الدور');
      if (selectedRole?.id === id) setSelectedRole(null);
      fetchRoles();
    }
  };

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">الأدوار والصلاحيات</h1>
          <button
            onClick={createRole}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold"
          >
            <Plus size={16} /> إضافة دور
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* قائمة الأدوار */}
            <div className="bg-dark-100 rounded-xl border border-gray-800 p-4">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center justify-between">
                الأدوار
                <button onClick={fetchRoles} title="تحديث" className="text-gray-400 hover:text-white">
                  <RefreshCw size={16} />
                </button>
              </h2>
              <ul className="space-y-2">
                {roles.map(role => (
                  <li
                    key={role.id}
                    className={`p-2 rounded-lg cursor-pointer flex justify-between items-center ${
                      selectedRole?.id === role.id
                        ? 'bg-cyan-600/20 border-r-2 border-cyan-400'
                        : 'hover:bg-gray-800'
                    }`}
                  >
                    <span onClick={() => selectRole(role)} className="flex-1 text-white">
                      {role.name}
                    </span>
                    <button
                      onClick={() => deleteRole(role.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
                {roles.length === 0 && (
                  <li className="text-gray-400 text-center py-4">لا توجد أدوار</li>
                )}
              </ul>
            </div>

            {/* تفاصيل الدور المحدد وصلاحياته */}
            <div className="md:col-span-2 bg-dark-100 rounded-xl border border-gray-800 p-4">
              {selectedRole ? (
                <>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={roleName}
                      onChange={e => setRoleName(e.target.value)}
                      className="flex-1 p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
                      placeholder="اسم الدور"
                    />
                    <button
                      onClick={updateRoleName}
                      className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700"
                    >
                      <Save size={16} />
                    </button>
                  </div>
                  <div className="mb-4 flex justify-end">
                    <button
                      onClick={saveRolePermissions}
                      className="px-3 py-1 rounded-lg bg-green-600 text-white text-sm"
                    >
                      حفظ الصلاحيات
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {permissions.map(perm => (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={rolePermissions.has(perm.id)}
                          onChange={() => {
                            const newSet = new Set(rolePermissions);
                            if (newSet.has(perm.id)) newSet.delete(perm.id);
                            else newSet.add(perm.id);
                            setRolePermissions(newSet);
                          }}
                          className="w-4 h-4 text-cyan-600 rounded border-gray-600 focus:ring-cyan-500"
                        />
                        <span className="text-gray-300 text-sm">
                          {perm.description || perm.name}
                        </span>
                      </label>
                    ))}
                    {permissions.length === 0 && (
                      <div className="text-gray-400 text-center py-4 col-span-2">
                        لا توجد صلاحيات محددة بعد
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-400 py-20">
                  اختر دوراً من القائمة لعرض وتعديل صلاحياته
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}