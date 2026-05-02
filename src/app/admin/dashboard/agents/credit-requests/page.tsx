'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CreditRequest {
  id: string;
  agent_id: string;
  agent_email: string;
  amount: number;
  status: string;
  reason: string;
  created_at: string;
}

export default function CreditRequestsPage() {
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from('credit_requests')
      .select('*, agents:agent_id(email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) toast.error('فشل جلب الطلبات');
    else {
      const formatted = (data || []).map(r => ({ ...r, agent_email: r.agents?.email || r.agent_id }));
      setRequests(formatted);
    }
    setLoading(false);
  }

  async function approveRequest(id: string) {
    const { error } = await supabase.rpc('approve_credit_request', { request_id: id });
    if (error) toast.error('فشل الموافقة');
    else {
      toast.success('تمت الموافقة وإضافة الرصيد');
      fetchRequests();
    }
  }

  async function rejectRequest(id: string) {
    if (!rejectReason) return toast.error('يرجى إدخال سبب الرفض');
    const { error } = await supabase
      .from('credit_requests')
      .update({ status: 'rejected', rejection_reason: rejectReason })
      .eq('id', id);
    if (error) toast.error('فشل الرفض');
    else {
      toast.success('تم الرفض');
      setSelectedId(null);
      setRejectReason('');
      fetchRequests();
    }
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">طلبات المديونية</h1>
          <button onClick={fetchRequests} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600"><RefreshCw size={18} /></button>
        </div>
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : requests.length === 0 ? <div className="text-center py-20 text-gray-400">لا توجد طلبات معلقة</div> : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr><th className="p-3 text-right">الوكيل</th><th className="p-3 text-right">المبلغ</th><th className="p-3 text-right">التاريخ</th><th className="p-3 text-right">السبب</th><th className="p-3 text-right">إجراءات</th></tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{r.agent_email}</td><td className="p-3 text-gray-300">${r.amount}</td>
                    <td className="p-3 text-gray-300">{new Date(r.created_at).toLocaleDateString('ar-SY')}</td><td className="p-3 text-gray-300">{r.reason || '-'}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => approveRequest(r.id)} className="text-green-400"><CheckCircle size={18} /></button>
                      <button onClick={() => setSelectedId(r.id)} className="text-red-400"><XCircle size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {selectedId && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-dark-100 rounded-2xl p-6 w-96 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">سبب الرفض</h3>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 mb-4" rows={2} />
              <div className="flex gap-2">
                <button onClick={() => rejectRequest(selectedId)} className="flex-1 py-2 rounded-xl bg-red-600 text-white">تأكيد الرفض</button>
                <button onClick={() => setSelectedId(null)} className="flex-1 py-2 rounded-xl bg-gray-700 text-white">إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}