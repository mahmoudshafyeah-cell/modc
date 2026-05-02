'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface KycRequest {
  id: string;
  user_id: string;
  user_email: string;
  full_name_ar: string;
  national_id: string;
  id_front_url: string;
  id_back_url: string;
  selfie_url: string;
  status: string;
  created_at: string;
}

export default function KycRequestsPage() {
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from('kyc_verifications')
      .select('*, profiles:user_id(email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) toast.error('فشل جلب طلبات KYC');
    else {
      const formatted = (data || []).map(k => ({ ...k, user_email: k.profiles?.email || k.user_id }));
      setRequests(formatted);
    }
    setLoading(false);
  }

  async function approveKyc(id: string) {
    const { error } = await supabase
      .from('kyc_verifications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error('فشل الموافقة');
    else {
      toast.success('تمت الموافقة على KYC');
      fetchRequests();
    }
  }

  async function rejectKyc(id: string) {
    if (!rejectReason) return toast.error('يرجى إدخال سبب الرفض');
    const { error } = await supabase
      .from('kyc_verifications')
      .update({ status: 'rejected', rejection_reason: rejectReason, reviewed_at: new Date().toISOString() })
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
          <h1 className="text-2xl font-bold text-white">طلبات توثيق الهوية (KYC)</h1>
          <button onClick={fetchRequests} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600"><RefreshCw size={18} /></button>
        </div>
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : requests.length === 0 ? <div className="text-center py-20 text-gray-400">لا توجد طلبات معلقة</div> : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="bg-dark-100 rounded-xl p-6 border border-gray-800">
                <div className="flex justify-between items-start mb-4">
                  <div><h3 className="text-white font-bold">{req.full_name_ar}</h3><p className="text-gray-400 text-sm">{req.user_email}</p><p className="text-gray-500 text-xs">الرقم الوطني: {req.national_id}</p></div>
                  <div className="flex gap-2">
                    <button onClick={() => approveKyc(req.id)} className="text-green-400"><CheckCircle size={20} /></button>
                    <button onClick={() => setSelectedId(req.id)} className="text-red-400"><XCircle size={20} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <a href={req.id_front_url} target="_blank" className="text-cyan-400 flex items-center gap-1"><Eye size={14} /> الهوية (أمام)</a>
                  <a href={req.id_back_url} target="_blank" className="text-cyan-400 flex items-center gap-1"><Eye size={14} /> الهوية (خلف)</a>
                  <a href={req.selfie_url} target="_blank" className="text-cyan-400 flex items-center gap-1"><Eye size={14} /> صورة شخصية</a>
                </div>
                <p className="text-gray-500 text-xs mt-2">تاريخ التقديم: {new Date(req.created_at).toLocaleString('ar-SY')}</p>
              </div>
            ))}
          </div>
        )}
        {selectedId && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-dark-100 rounded-2xl p-6 w-96 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">سبب رفض طلب KYC</h3>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 mb-4" rows={2} />
              <div className="flex gap-2">
                <button onClick={() => rejectKyc(selectedId)} className="flex-1 py-2 rounded-xl bg-red-600 text-white">تأكيد الرفض</button>
                <button onClick={() => setSelectedId(null)} className="flex-1 py-2 rounded-xl bg-gray-700 text-white">إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}