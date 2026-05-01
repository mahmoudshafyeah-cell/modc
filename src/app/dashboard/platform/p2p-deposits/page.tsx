'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';
import { CheckCircle, XCircle, MessageCircle, Clock, RefreshCw } from 'lucide-react';

interface P2PRequest {
  id: string;
  order_number: string;
  deposit_number: string;
  user_id: string;
  user_email: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function P2PDepositsPage() {
  const [requests, setRequests] = useState<P2PRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionItem, setActionItem] = useState<P2PRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    fetchP2PSettings();
    fetchRequests();
  }, []);

  async function fetchP2PSettings() {
    const { data } = await supabase.from('platform_settings').select('whatsapp_number').single();
    setWhatsappNumber(data?.whatsapp_number || '');
  }

  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from('p2p_deposits')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) toast.error('فشل جلب طلبات P2P');
    else setRequests(data || []);
    setLoading(false);
  }

  async function handleApprove(item: P2PRequest) {
    const { error } = await supabase
      .from('p2p_deposits')
      .update({ status: 'approved', processed_at: new Date().toISOString() })
      .eq('id', item.id);
    if (error) toast.error('فشل الموافقة');
    else {
      // إضافة الرصيد إلى محفظة المستخدم
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
      toast.success('تمت الموافقة وإضافة الرصيد');
      fetchRequests();
    }
    setActionItem(null);
  }

  async function handleReject(item: P2PRequest) {
    const { error } = await supabase
      .from('p2p_deposits')
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

  const remainingMinutes = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const diff = 30 * 60 * 1000 - (now - created);
    if (diff <= 0) return 'منتهي';
    const mins = Math.floor(diff / 60000);
    return `${mins} دقيقة`;
  };

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">إيداعات P2P (بينانس)</h1>
          <button onClick={fetchRequests} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600"><RefreshCw size={18} className="text-gray-300" /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد طلبات P2P معلقة</div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-3 text-right">العميل</th>
                  <th className="p-3 text-right">المبلغ</th>
                  <th className="p-3 text-right">رقم الطلب</th>
                  <th className="p-3 text-right">رقم الإيداع</th>
                  <th className="p-3 text-right">الوقت المتبقي</th>
                  <th className="p-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{r.user_email}</td>
                    <td className="p-3 text-gray-300">${r.amount.toFixed(2)}</td>
                    <td className="p-3 font-mono text-gray-300">{r.order_number}</td>
                    <td className="p-3 font-mono text-gray-300">{r.deposit_number}</td>
                    <td className="p-3"><span className={`flex items-center gap-1 ${remainingMinutes(r.created_at) === 'منتهي' ? 'text-red-400' : 'text-yellow-400'}`}><Clock size={14} /> {remainingMinutes(r.created_at)}</span></td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => { setActionItem(r); setActionType('approve'); }} className="text-green-400"><CheckCircle size={18} /></button>
                      <button onClick={() => { setActionItem(r); setActionType('reject'); }} className="text-red-400"><XCircle size={18} /></button>
                      {whatsappNumber && (
                        <a href={`https://wa.me/${whatsappNumber}?text=طلب P2P رقم ${r.order_number} - المبلغ ${r.amount}$`} target="_blank" rel="noopener" className="text-green-500"><MessageCircle size={18} /></a>
                      )}
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
              <p className="text-gray-300 mb-2">العميل: {actionItem.user_email}</p>
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