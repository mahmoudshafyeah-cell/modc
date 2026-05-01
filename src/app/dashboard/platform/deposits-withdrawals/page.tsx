'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';
import { CheckCircle, XCircle, Eye, Loader2, RefreshCw } from 'lucide-react';

interface Request {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  method_name: string;
  proof_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function DepositsWithdrawalsPage() {
  const [tab, setTab] = useState<'deposits' | 'withdrawals'>('deposits');
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionItem, setActionItem] = useState<Request | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [tab]);

  async function fetchRequests() {
    setLoading(true);
    const table = tab === 'deposits' ? 'deposit_requests' : 'withdrawal_requests';
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) toast.error('فشل جلب الطلبات');
    else setRequests(data || []);
    setLoading(false);
  }

  async function handleApprove(item: Request) {
    const table = tab === 'deposits' ? 'deposit_requests' : 'withdrawal_requests';
    const { error } = await supabase
      .from(table)
      .update({ status: 'approved', processed_at: new Date().toISOString() })
      .eq('id', item.id);
    if (error) toast.error('فشل الموافقة');
    else {
      // إذا كانت إيداع، نضيف الرصيد إلى محفظة المستخدم
      if (tab === 'deposits') {
        // جلب الرصيد الحالي
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', item.user_id)
          .single();
        const newBalance = (wallet?.balance || 0) + item.amount;
        await supabase
          .from('wallets')
          .update({ balance: newBalance })
          .eq('user_id', item.user_id);
      } else {
        // للسحب: نخصم الرصيد (يجب التحقق من كفايته قبل الموافقة)
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', item.user_id)
          .single();
        if ((wallet?.balance || 0) < item.amount) {
          toast.error('رصيد المستخدم غير كافٍ');
          return;
        }
        const newBalance = (wallet?.balance || 0) - item.amount;
        await supabase
          .from('wallets')
          .update({ balance: newBalance })
          .eq('user_id', item.user_id);
      }
      toast.success('تمت الموافقة');
      fetchRequests();
    }
  }

  async function handleReject(item: Request) {
    const table = tab === 'deposits' ? 'deposit_requests' : 'withdrawal_requests';
    const { error } = await supabase
      .from(table)
      .update({ status: 'rejected', rejection_reason: reason, processed_at: new Date().toISOString() })
      .eq('id', item.id);
    if (error) toast.error('فشل الرفض');
    else {
      toast.success('تم الرفض');
      fetchRequests();
    }
    setActionItem(null);
    setActionType(null);
    setReason('');
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">الإيداعات والسحوبات</h1>
          <button onClick={fetchRequests} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600">
            <RefreshCw size={18} className="text-gray-300" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-gray-700">
          <button onClick={() => setTab('deposits')} className={`px-4 py-2 rounded-t-lg transition ${tab === 'deposits' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>إيداعات معلقة</button>
          <button onClick={() => setTab('withdrawals')} className={`px-4 py-2 rounded-t-lg transition ${tab === 'withdrawals' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>سحوبات معلقة</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد طلبات معلقة</div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-3 text-right">المستخدم</th>
                  <th className="p-3 text-right">المبلغ</th>
                  <th className="p-3 text-right">الطريقة</th>
                  <th className="p-3 text-right">التاريخ</th>
                  <th className="p-3 text-right">إثبات</th>
                  <th className="p-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{r.user_email || r.user_id}</td>
                    <td className="p-3 text-gray-300">${r.amount.toFixed(2)}</td>
                    <td className="p-3 text-gray-300">{r.method_name}</td>
                    <td className="p-3 text-gray-300">{new Date(r.created_at).toLocaleString('ar-SY')}</td>
                    <td className="p-3">
                      {r.proof_url && (
                        <a href={r.proof_url} target="_blank" rel="noopener" className="text-cyan-400"><Eye size={16} /></a>
                      )}
                    </td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => { setActionItem(r); setActionType('approve'); }} className="text-green-400"><CheckCircle size={18} /></button>
                      <button onClick={() => { setActionItem(r); setActionType('reject'); }} className="text-red-400"><XCircle size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {actionItem && actionType && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-dark-100 rounded-2xl p-6 w-96 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">{actionType === 'approve' ? 'تأكيد الموافقة' : 'تأكيد الرفض'}</h3>
              <p className="text-gray-300 mb-2">المستخدم: {actionItem.user_email}</p>
              <p className="text-gray-300 mb-4">المبلغ: ${actionItem.amount}</p>
              {actionType === 'reject' && (
                <textarea placeholder="سبب الرفض" value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 mb-4" rows={2} />
              )}
              <div className="flex gap-2">
                <button onClick={() => actionType === 'approve' ? handleApprove(actionItem) : handleReject(actionItem)} className="flex-1 py-2 rounded-xl bg-cyan-600 text-white font-bold">تأكيد</button>
                <button onClick={() => { setActionItem(null); setActionType(null); setReason(''); }} className="flex-1 py-2 rounded-xl bg-gray-700 text-white">إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}