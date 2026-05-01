// src/app/dashboard/KycManager.tsx
'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye, Search } from 'lucide-react';

interface KycRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  full_name_ar: string;
  national_id: string;
  id_front_url: string;
  id_back_url: string;
  selfie_front_url: string;
  selfie_back_url: string;
  status: string;
  submitted_at: string;
}

export default function KycManager() {
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { fetchRequests(); }, []);

  async function fetchRequests() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/kyc', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
      else toast.error(data.error);
    } catch { toast.error('فشل جلب طلبات KYC'); }
    finally { setLoading(false); }
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    if (action === 'reject' && !rejectReason.trim()) {
      toast.error('يرجى ذكر سبب الرفض');
      return;
    }
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/kyc/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(action === 'approve' ? 'تمت الموافقة' : 'تم الرفض');
      setRejectId(null);
      setRejectReason('');
      fetchRequests();
    } catch (error: any) { toast.error(error.message); }
  }

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <h2 className="text-xl font-bold text-white">طلبات التحقق (KYC)</h2>
      
      {requests.length === 0 ? (
        <p className="text-gray-400 text-center py-8">لا توجد طلبات تحقق</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {requests.map(req => (
            <div key={req.id} className="rounded-2xl p-4" style={{ background: '#111128', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="font-bold text-white">{req.full_name_ar}</p>
              <p className="text-gray-400 text-sm">{req.user_email}</p>
              <p className="text-gray-500 text-xs mt-1">الرقم الوطني: {req.national_id}</p>
              
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { url: req.id_front_url, label: 'الهوية أمام' },
                  { url: req.id_back_url, label: 'الهوية خلف' },
                  { url: req.selfie_front_url, label: 'سيلفي أمام' },
                  { url: req.selfie_back_url, label: 'سيلفي خلف' },
                ].map(img => (
                  <button key={img.label} onClick={() => setPreviewUrl(img.url)} className="p-2 rounded-lg bg-dark-50 text-xs text-gray-400 hover:text-white">
                    👁 {img.label}
                  </button>
                ))}
              </div>

              {rejectId === req.id ? (
                <div className="mt-3 space-y-2">
                  <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="سبب الرفض" className="w-full p-2 rounded bg-dark-50 border border-gray-700 text-white text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(req.id, 'reject')} className="flex-1 py-1.5 rounded bg-red-600 text-white text-sm">تأكيد الرفض</button>
                    <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="flex-1 py-1.5 rounded bg-gray-700 text-white text-sm">إلغاء</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleAction(req.id, 'approve')} className="flex-1 py-2 rounded bg-green-600 text-white text-sm flex items-center justify-center gap-1"><CheckCircle size={14} /> قبول</button>
                  <button onClick={() => setRejectId(req.id)} className="flex-1 py-2 rounded bg-red-600/20 text-red-400 text-sm flex items-center justify-center gap-1"><XCircle size={14} /> رفض</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} alt="معاينة" className="max-w-full max-h-[90vh] rounded-xl" />
        </div>
      )}
    </div>
  );
}