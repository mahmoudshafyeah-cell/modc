// src/app/(main)/agent-dashboard/components/BuyBalanceModal.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  X, ArrowDownCircle, Loader2, Upload, Copy, MessageCircle,
  CheckCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface BuyBalanceModalProps {
  open: boolean;
  onClose: () => void;
  userData: any;
  onSuccess?: () => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  type?: string;
  is_active: boolean;
  is_p2p?: boolean;
  category?: string;
  account_number?: string;
  instructions?: string;
  requires_proof?: boolean;
}

export default function BuyBalanceModal({ open, onClose, userData, onSuccess }: BuyBalanceModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [fetchingMethods, setFetchingMethods] = useState(true);

  // للطرق اليدوية
  const [reference, setReference] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // P2P
  const [p2pData, setP2pData] = useState<any>(null);
  const [p2pWhatsapp, setP2pWhatsapp] = useState('');

  // نجاح
  const [success, setSuccess] = useState(false);

  // إعادة تعيين جميع الحالات عند فتح/إغلاق النافذة
  const resetForm = () => {
    setAmount('');
    setSelectedMethod('');
    setLoading(false);
    setReference('');
    setImageFile(null);
    setImagePreview(null);
    setP2pData(null);
    setSuccess(false);
  };

  useEffect(() => {
    if (open) {
      resetForm();
      fetchPaymentMethods();
      fetchP2PSettings();
    }
  }, [open]);

  async function fetchP2PSettings() {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok && data.settings?.p2p_whatsapp) {
        setP2pWhatsapp(data.settings.p2p_whatsapp);
      }
    } catch {}
  }

  async function fetchPaymentMethods() {
    setFetchingMethods(true);
    try {
      const res = await fetch('/api/payment-methods');
      const data = await res.json();
      if (res.ok && data.methods) {
        const activeMethods = data.methods.filter(
          (m: PaymentMethod) => m.is_active && m.category !== 'withdrawal'
        );
        setPaymentMethods(activeMethods);
        if (activeMethods.length > 0) {
          setSelectedMethod(activeMethods[0].id);
        }
      }
    } catch (error) {
      console.error('فشل جلب طرق الدفع:', error);
      toast.error('فشل جلب طرق الدفع');
    } finally {
      setFetchingMethods(false);
    }
  }

  const manualMethods = paymentMethods.filter(m => !m.is_p2p);
  const p2pMethods = paymentMethods.filter(m => m.is_p2p);
  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);

  // رفع صورة الإثبات
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // تقديم إيداع يدوي
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (!selectedMethod) {
      toast.error('يرجى اختيار طريقة الدفع');
      return;
    }
    if (!imageFile && selectedMethodData?.requires_proof !== false) {
      toast.error('يرجى رفع صورة إثبات الدفع');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('method_id', selectedMethod);
      formData.append('userId', userData.id);
      formData.append('reference', reference || `Agent-${Date.now()}`);
      if (imageFile) formData.append('image', imageFile);

      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال الطلب');

      setSuccess(true);
      toast.success(`تم إرسال طلب إيداع بقيمة $${amount} بنجاح`);
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // تقديم طلب P2P
  const handleP2PDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/deposit/p2p', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء طلب P2P');

      setP2pData({
        ...data,
        methodName: selectedMethodData?.name || 'Binance P2P',
        whatsapp: p2pWhatsapp || null,
      });
      toast.success('تم إنشاء طلب P2P بنجاح');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const renderSuccess = () => (
    <div className="p-12 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: 'rgba(0,255,148,0.15)', border: '2px solid rgba(0,255,148,0.4)' }}>
        <CheckCircle size={40} className="text-green-400" />
      </div>
      <h3 className="text-2xl font-black text-white mb-2">تم الإرسال بنجاح!</h3>
      <p className="text-gray-400">سيتم مراجعة طلبك وإضافة الرصيد خلال 15 دقيقة</p>
      <button onClick={onClose} className="mt-6 px-6 py-2 rounded-xl bg-gray-700 text-white">إغلاق</button>
    </div>
  );

  const renderP2PResult = () => (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="rounded-xl p-4 text-center" style={{ background: '#F0B90B10', border: '1px solid #F0B90B30' }}>
        <div className="text-4xl mb-3">🟡</div>
        <h3 className="text-xl font-bold text-white mb-2">طلب P2P - {p2pData.methodName}</h3>
        <p className="text-sm text-gray-400 mb-4">تم إنشاء طلبك بنجاح. استخدم البيانات أدناه للتحويل.</p>
        
        <div className="bg-dark-50 rounded-xl p-4 space-y-3 text-right">
          <div>
            <p className="text-xs text-gray-500">رقم الطلب</p>
            <p className="text-lg font-mono font-bold text-white">{p2pData.order_number}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">رقم الإيداع</p>
            <p className="text-lg font-mono font-bold text-white">DC-{p2pData.deposit_number}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={() => { navigator.clipboard.writeText(p2pData.order_number); toast.success('تم نسخ رقم الطلب'); }}
            className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-bold flex items-center justify-center gap-2">
            <Copy size={16} /> نسخ رقم الطلب
          </button>
          {p2pData.whatsapp && (
            <a href={`https://wa.me/${p2pData.whatsapp}?text=${encodeURIComponent('مرحباً، رقم الطلب: ' + p2pData.order_number)}`} target="_blank"
              className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2">
              <MessageCircle size={16} /> واتساب
            </a>
          )}
        </div>
        <button onClick={onClose} className="w-full mt-3 py-2 rounded-xl bg-gray-800 text-gray-400 text-sm">إغلاق</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto" style={{ background: '#111128', border: '1px solid rgba(0,255,148,0.3)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(0,255,148,0.15)' }}>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"><X size={16} /></button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,255,148,0.15)', border: '1px solid rgba(0,255,148,0.3)' }}>
              <ArrowDownCircle size={20} className="text-green-400" />
            </div>
            <div className="text-right">
              <h3 className="font-bold text-white">إيداع رصيد</h3>
              <p className="text-xs text-gray-400">إضافة رصيد إلى محفظة الوكيل</p>
            </div>
          </div>
        </div>

        {success ? renderSuccess() :
         p2pData ? renderP2PResult() :
        (
          <form onSubmit={handleSubmitManual} className="p-6 space-y-5" dir="rtl">
            {/* المبلغ */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-3 text-right">المبلغ (USD)</label>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {['50', '100', '200', '500', '1000'].map(v => (
                  <button key={v} type="button" onClick={() => setAmount(v)}
                    className="py-2 rounded-xl text-sm font-bold transition-all duration-200"
                    style={amount === v ? { background: 'rgba(0,255,148,0.2)', border: '1px solid rgba(0,255,148,0.5)', color: '#00FF94' }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }}>${v}</button>
                ))}
              </div>
              <input type="number" placeholder="أو أدخل مبلغاً مخصصاً..." value={amount} onChange={e => setAmount(e.target.value)} className="input-field text-right w-full" />
            </div>

            {/* طرق الدفع */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-3 text-right">طريقة الدفع</label>
              {fetchingMethods ? (
                <p className="text-gray-400 text-center py-4">جاري التحميل...</p>
              ) : paymentMethods.length === 0 ? (
                <p className="text-gray-400 text-center py-4">لا توجد طرق دفع</p>
              ) : (
                <div className="space-y-3">
                  {manualMethods.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {manualMethods.map(m => (
                        <button key={m.id} type="button" onClick={() => setSelectedMethod(m.id)}
                          className="flex items-center gap-2 p-3 rounded-xl transition-all text-right"
                          style={selectedMethod === m.id
                            ? { background: `${m.color || '#00D4FF'}20`, border: `1px solid ${m.color || '#00D4FF'}50`, color: m.color || '#00D4FF' }
                            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF' }}>
                          <span className="text-xl">{m.icon || '💳'}</span>
                          <span className="text-sm font-semibold">{m.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {p2pMethods.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">P2P (تحويل مباشر)</p>
                      {p2pMethods.map(m => (
                        <button key={m.id} type="button" onClick={() => { setSelectedMethod(m.id); }}
                          className="w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02] mb-2"
                          style={{ background: '#F0B90B18', border: '1px solid #F0B90B40' }}>
                          <span className="text-xl">🟡</span>
                          <span className="text-sm font-semibold" style={{ color: '#F0B90B' }}>{m.name} (P2P)</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* تفاصيل الطريقة اليدوية */}
            {selectedMethodData && !selectedMethodData.is_p2p && (
              <>
                <div className="rounded-xl p-4 text-right" style={{ background: 'rgba(38,161,123,0.1)', border: '1px solid rgba(38,161,123,0.25)' }}>
                  <p className="text-xs font-bold text-green-400 mb-1">حول المبلغ إلى هذا الحساب</p>
                  {selectedMethodData.account_number && (
                    <p className="font-mono text-sm text-white" dir="ltr">{selectedMethodData.account_number}</p>
                  )}
                  {selectedMethodData.instructions && (
                    <p className="text-xs text-gray-400 mt-1">{selectedMethodData.instructions}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2 text-right">رقم العملية / المرجع</label>
                  <input type="text" value={reference} onChange={e => setReference(e.target.value)}
                    placeholder="مثال: TXN-2847364" className="input-field text-right w-full" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2 text-right">صورة إثبات الدفع</label>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-700">
                      <img src={imagePreview} alt="إثبات" className="w-full max-h-40 object-cover" />
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-red-600/80 text-white flex items-center justify-center"><X size={14} /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-full py-10 rounded-xl flex flex-col items-center gap-2 transition-all hover:border-cyan-500"
                      style={{ background: 'rgba(12, 113, 178, 0.05)', border: '2px dashed rgba(12, 113, 178, 0.3)' }}>
                      <Upload size={24} style={{ color: '#0c71b2' }} />
                      <span className="text-sm text-gray-400">اضغط لرفع صورة الإثبات</span>
                    </button>
                  )}
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #00FF94, #00D4FF)', color: '#0A0A14' }}>
                  {loading ? <><Loader2 size={18} className="animate-spin" /><span>جاري المعالجة...</span></> : <><ArrowDownCircle size={18} /><span>تأكيد الإيداع {amount ? `($${amount})` : ''}</span></>}
                </button>
              </>
            )}

            {/* زر P2P */}
            {selectedMethodData?.is_p2p && (
              <button type="button" onClick={handleP2PDeposit} disabled={loading}
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #F0B90B, #FF8C00)', color: '#1A1A2E' }}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><ArrowDownCircle size={18} /><span>إنشاء طلب P2P</span></>}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}