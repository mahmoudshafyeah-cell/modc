'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Search, Ban, UserCheck, Trash2, DollarSign, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface PlatformUser {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  balance: number;
  is_banned: boolean;
  last_sign_in_at?: string;
  created_at: string;
}

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('فشل جلب المستخدمين');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }

  async function toggleBan(userId: string, currentBanned: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !currentBanned })
      .eq('id', userId);
    if (error) toast.error('فشل تغيير الحالة');
    else {
      toast.success(currentBanned ? 'تم فك الحظر' : 'تم الحظر');
      fetchUsers();
    }
  }

  async function updateBalance(userId: string, amount: number) {
    // جلب الرصيد الحالي أولاً
    const { data: userData } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();
    const newBalance = (userData?.balance || 0) + amount;
    const { error } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', userId);
    if (error) toast.error('فشل تحديث الرصيد');
    else {
      toast.success(`تم ${amount >= 0 ? 'إضافة' : 'خصم'} $${Math.abs(amount)}`);
      setSelectedUser(null);
      fetchUsers();
    }
  }

  async function sendNotification(userId: string | null, title: string, message: string) {
    if (!title || !message) return;
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type: 'admin',
      read: false,
      created_at: new Date().toISOString(),
    });
    if (error) toast.error('فشل إرسال الإشعار');
    else {
      toast.success('تم إرسال الإشعار');
      setNotifyTitle('');
      setNotifyMessage('');
      setSelectedUser(null);
    }
  }

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">مستخدمو المنصة</h1>
          <button onClick={fetchUsers} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600">
            <RefreshCw size={18} className="text-gray-300" />
          </button>
        </div>

        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="ابحث بالبريد أو الاسم..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-80 pr-9 py-2 rounded-xl bg-dark-100 border border-gray-700 text-white text-sm"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا يوجد مستخدمون</div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-3 text-right">البريد</th>
                  <th className="p-3 text-right">الاسم</th>
                  <th className="p-3 text-right">الدور</th>
                  <th className="p-3 text-right">الرصيد</th>
                  <th className="p-3 text-right">محظور</th>
                  <th className="p-3 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{u.email}</td>
                    <td className="p-3 text-gray-300">{u.full_name || '-'}</td>
                    <td className="p-3 text-gray-300">{u.role}</td>
                    <td className="p-3 text-gray-300">${u.balance?.toFixed(2) || '0'}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded-lg text-xs ${u.is_banned ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'}`}>{u.is_banned ? 'نعم' : 'لا'}</span></td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => toggleBan(u.id, u.is_banned)} className="p-1.5 rounded-lg bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30" title={u.is_banned ? 'فك الحظر' : 'حظر'}>{u.is_banned ? <UserCheck size={16} /> : <Ban size={16} />}</button>
                      <button onClick={() => setSelectedUser(u)} className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"><DollarSign size={16} /></button>
                      <button onClick={() => { setSelectedUser(u); setNotifyTitle(''); setNotifyMessage(''); }} className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30"><Bell size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedUser && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-dark-100 rounded-2xl p-6 w-96 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-2">{selectedUser.email}</h3>
              <input type="number" placeholder="المبلغ (موجب للإضافة، سالب للخصم)" value={balanceAmount} onChange={e => setBalanceAmount(parseFloat(e.target.value))} className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 mb-3" />
              <button onClick={() => updateBalance(selectedUser.id, balanceAmount)} className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold mb-3">تحديث الرصيد</button>
              <hr className="border-gray-700 my-3" />
              <input type="text" placeholder="عنوان الإشعار" value={notifyTitle} onChange={e => setNotifyTitle(e.target.value)} className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 mb-2" />
              <textarea placeholder="نص الإشعار" value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)} className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 mb-3" rows={3} />
              <button onClick={() => sendNotification(selectedUser.id, notifyTitle, notifyMessage)} className="w-full py-2 rounded-xl bg-purple-600 text-white font-bold">إرسال إشعار</button>
              <button onClick={() => setSelectedUser(null)} className="w-full mt-2 py-2 rounded-xl bg-gray-700 text-white">إلغاء</button>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}