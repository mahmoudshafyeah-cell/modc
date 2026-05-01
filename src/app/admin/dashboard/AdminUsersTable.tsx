// src/app/dashboard/AdminUsersTable.tsx
'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { X, Ban, CheckCircle, Eye, Trash2, Plus, Minus, MailCheck } from 'lucide-react';

interface User {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: string;
  is_banned: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  last_sign_in_ip: string | null;
  email_confirmed: boolean;
  balance?: number; // <-- يُقرأ مباشرة من API
}

export default function AdminUsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [balanceModal, setBalanceModal] = useState<{
    open: boolean;
    userId: string;
    currentBalance: number;
    operation: 'add' | 'subtract';
  } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب المستخدمين');
      // البيانات تأتي مع balance
      setUsers(data.users || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(userId: string, newRole: string) { /* ... نفس الكود ... */ }
  async function handleBan(userId: string, ban: boolean) { /* ... */ }
  async function handleDelete(userId: string) { /* ... */ }
  async function handleConfirmEmail(userId: string) { /* ... */ }

  async function handleAdjustBalance(userId: string, amount: number) {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تعديل الرصيد');
      toast.success(`تم ${amount > 0 ? 'إضافة' : 'خصم'} ${Math.abs(amount).toFixed(2)}$`);
      fetchUsers(); // إعادة تحميل البيانات
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const openBalanceModal = (userId: string, currentBalance: number, operation: 'add' | 'subtract') => {
    setBalanceModal({ open: true, userId, currentBalance, operation });
    setAdjustAmount('');
  };

  const confirmBalanceAdjust = () => {
    if (!balanceModal) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) { toast.error('يرجى إدخال مبلغ صحيح'); return; }
    const finalAmount = balanceModal.operation === 'add' ? amount : -amount;
    handleAdjustBalance(balanceModal.userId, finalAmount);
    setBalanceModal(null);
    setAdjustAmount('');
  };

  const isActive = (lastSignIn: string | null) => {
    if (!lastSignIn) return false;
    const diff = Date.now() - new Date(lastSignIn).getTime();
    return diff < 24 * 60 * 60 * 1000;
  };

  if (loading) return <div className="text-gray-400 p-6">جاري التحميل...</div>;

  return (
    <>
      <div className="rounded-2xl bg-dark-100 border border-violet-500/20 overflow-x-auto">
        <table className="w-full text-right">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-4 text-gray-400">المستخدم</th>
              <th className="p-4 text-gray-400">البريد الإلكتروني</th>
              <th className="p-4 text-gray-400">رقم الهاتف</th>
              <th className="p-4 text-gray-400">الدور</th>
              <th className="p-4 text-gray-400">الحالة</th>
              <th className="p-4 text-gray-400">النشاط</th>
              <th className="p-4 text-gray-400">الرصيد</th>
              <th className="p-4 text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const showBalance = user.role === 'customer' || user.role === 'agent';
              const balance = user.balance ?? 0;
              return (
                <tr key={user.id} className="border-b border-gray-800">
                  <td className="p-4 text-white">{user.full_name || 'غير محدد'}</td>
                  <td className="p-4 text-gray-300" dir="ltr">{user.email}</td>
                  <td className="p-4 text-gray-300" dir="ltr">{user.phone || '-'}</td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value)}
                      className="bg-dark-50 border border-gray-700 rounded-lg p-1 text-white"
                    >
                      <option value="customer">عميل</option>
                      <option value="agent">وكيل</option>
                      <option value="staff">موظف</option>
                      <option value="super_admin">مدير عام</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs ${user.is_banned ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'}`}>
                      {user.is_banned ? 'محظور' : 'نشط'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs ${isActive(user.last_sign_in_at) ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-600/20 text-gray-400'}`}>
                      {isActive(user.last_sign_in_at) ? 'نشط اليوم' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="p-4 text-white">
                    {showBalance ? (
                      <div className="flex items-center gap-2">
                        <span>${balance.toFixed(2)}</span>
                        <button onClick={() => openBalanceModal(user.id, balance, 'add')} className="p-1 rounded bg-green-600/20 text-green-400" title="إضافة رصيد"><Plus size={12} /></button>
                        <button onClick={() => openBalanceModal(user.id, balance, 'subtract')} className="p-1 rounded bg-red-600/20 text-red-400" title="خصم رصيد"><Minus size={12} /></button>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => { setSelectedUser(user); setDetailsOpen(true); }} className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400" title="تفاصيل"><Eye size={14} /></button>
                      {!user.email_confirmed && (
                        <button onClick={() => handleConfirmEmail(user.id)} className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400" title="تأكيد البريد"><MailCheck size={14} /></button>
                      )}
                      {user.is_banned ? (
                        <button onClick={() => handleBan(user.id, false)} className="p-1.5 rounded-lg bg-green-600/20 text-green-400" title="رفع الحظر"><CheckCircle size={14} /></button>
                      ) : (
                        <button onClick={() => handleBan(user.id, true)} className="p-1.5 rounded-lg bg-red-600/20 text-red-400" title="حظر"><Ban size={14} /></button>
                      )}
                      <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded-lg bg-red-700/30 text-red-400" title="حذف"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-4 text-gray-400 text-center">لا يوجد مستخدمون</p>}
      </div>

      {/* نافذة تفاصيل المستخدم */}
      {detailsOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setDetailsOpen(false)}>
          <div className="bg-dark-100 rounded-2xl p-6 w-full max-w-md border border-violet-500/30" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setDetailsOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              <h3 className="text-lg font-bold text-white">تفاصيل المستخدم</h3>
            </div>
            <div className="space-y-3 text-white">
              <div className="flex justify-between"><span className="text-gray-400">الاسم:</span><span>{selectedUser.full_name || '-'}</span></div>
              <div className="flex justify-between" dir="ltr"><span className="text-gray-400">البريد:</span><span>{selectedUser.email}</span></div>
              <div className="flex justify-between" dir="ltr"><span className="text-gray-400">الهاتف:</span><span>{selectedUser.phone || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">الدور:</span><span>{selectedUser.role}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">الحالة:</span><span className={selectedUser.is_banned ? 'text-red-400' : 'text-green-400'}>{selectedUser.is_banned ? 'محظور' : 'نشط'}</span></div>
              <div className="flex justify-between" dir="ltr"><span className="text-gray-400">تاريخ التسجيل:</span><span>{new Date(selectedUser.created_at).toLocaleString('ar-SY')}</span></div>
              <div className="flex justify-between" dir="ltr"><span className="text-gray-400">آخر تسجيل دخول:</span><span>{selectedUser.last_sign_in_at ? new Date(selectedUser.last_sign_in_at).toLocaleString('ar-SY') : 'غير متاح'}</span></div>
              <div className="flex justify-between" dir="ltr"><span className="text-gray-400">آخر IP:</span><span>{selectedUser.last_sign_in_ip || '-'}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تعديل الرصيد */}
      {balanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setBalanceModal(null)}>
          <div className="bg-dark-100 rounded-2xl p-6 w-full max-w-sm border border-violet-500/30" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">{balanceModal.operation === 'add' ? 'إضافة رصيد' : 'خصم رصيد'}</h3>
            <p className="text-gray-400 mb-4">الرصيد الحالي: ${balanceModal.currentBalance.toFixed(2)}</p>
            <input type="number" step="0.01" min="0.01" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} placeholder="المبلغ" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white mb-4" autoFocus />
            <div className="flex gap-2">
              <button onClick={confirmBalanceAdjust} className="flex-1 py-2 rounded-xl bg-violet-600 text-white font-bold">موافق</button>
              <button onClick={() => setBalanceModal(null)} className="flex-1 py-2 rounded-xl bg-gray-700 text-white">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}