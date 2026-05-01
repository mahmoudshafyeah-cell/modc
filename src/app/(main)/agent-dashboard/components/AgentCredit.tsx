'use client';
import React, { useEffect, useState } from 'react';
import { CreditCard, Wallet, AlertCircle, Plus, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function AgentCredit({ userData }: { userData: any }) {
  const [creditData, setCreditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => { fetchCredit(); }, []);

  async function fetchCredit() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/credit', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setCreditData(data);
    } catch (error) {
      console.error('فشل جلب المديونية:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestCredit() {
    if (!requestAmount || parseFloat(requestAmount) <= 0) {
      toast.error('المبلغ غير صالح');
      return;
    }
    setRequestLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/request-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(requestAmount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الطلب');
      toast.success('تم تقديم طلب الرصيد الإضافي');
      setShowRequestModal(false);
      setRequestAmount('');
      fetchCredit();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setRequestLoading(false);
    }
  }

  if (loading) return <div className="animate-pulse h-32 rounded-2xl bg-dark-100" />;

  const { credit, walletBalance, availableCredit } = creditData || {
    credit: { credit_limit: 0, used_credit: 0 },
    walletBalance: 0,
    availableCredit: 0,
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-2xl p-6" style={{ background: '#111128', border: '1px solid rgba(255,68,102,0.2)' }}>
        <div className="flex items-center gap-3 mb-4">
          <CreditCard size={24} style={{ color: '#FF4466' }} />
          <h3 className="text-lg font-bold text-white">المديونية</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,68,102,0.1)' }}>
            <p className="text-xs text-gray-400 mb-1">السقف الائتماني</p>
            <p className="text-xl font-black text-red-400">${credit.credit_limit.toFixed(2)}</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,184,0,0.1)' }}>
            <p className="text-xs text-gray-400 mb-1">المستخدم حالياً</p>
            <p className="text-xl font-black text-amber-400">${credit.used_credit.toFixed(2)}</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(0,255,148,0.1)' }}>
            <p className="text-xs text-gray-400 mb-1">المتاح</p>
            <p className="text-xl font-black text-green-400">${availableCredit.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
          <Wallet size={14} />
          <span>رصيد المحفظة: ${walletBalance.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={() => setShowRequestModal(true)}
        className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #FF4466, #FF6B00)' }}
      >
        <Plus size={18} />
        طلب رصيد إضافي (مديونية)
      </button>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowRequestModal(false)}>
          <div className="bg-dark-100 rounded-2xl p-6 w-full max-w-md border border-red-500/30" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">طلب رصيد إضافي</h3>
            <p className="text-sm text-gray-400 mb-4">
              المبلغ المتاح للسحب من السقف الائتماني: <span className="text-green-400 font-bold">${availableCredit.toFixed(2)}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">المبلغ المطلوب</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="number"
                    value={requestAmount}
                    onChange={e => setRequestAmount(e.target.value)}
                    placeholder="0.00"
                    className="input-field pr-9 text-right w-full"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRequestCredit}
                  disabled={requestLoading}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {requestLoading ? 'جاري...' : 'تقديم الطلب'}
                </button>
                <button onClick={() => setShowRequestModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-gray-700 text-white">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}