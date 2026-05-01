// src/app/(main)/customer-dashboard/components/DepositModal.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, CheckCircle, Loader2, AlertCircle, ImageIcon, Copy, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface DepositValues {
  amount: string;
  method: string;
  reference: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  instructions?: string;
  account_number?: string;
  barcode_image?: string;
  color?: string;
  icon?: string;
  is_p2p?: boolean;
  category?: string;
  image_url?: string; // ✅ الصورة المميزة
}

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

export default function DepositModal({ open, onClose, userId, onSuccess }: DepositModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DepositValues>();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fetchingMethods, setFetchingMethods] = useState(true);
  const [p2pData, setP2pData] = useState<any>(null);
  const [p2pLoading, setP2pLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) fetchPaymentMethods();
  }, [open]);

  async function fetchPaymentMethods() {
    setFetchingMethods(true);
    try {
      const res = await fetch('/api/payment-methods');
      const data = await res.json();
      if (res.ok) {
        const activeMethods = data.methods.filter((m: PaymentMethod) => m.is_active);
        setPaymentMethods(activeMethods);
        const defaultMethod = activeMethods.find(m => !m.is_p2p);
        if (defaultMethod) setSelectedMethod(defaultMethod.id);
      }
    } catch (error) {
      console.error('فشل جلب طرق الدفع:', error);
    } finally {
      setFetchingMethods(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = ev => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // P2P deposit handler
  const handleP2PSubmit = async (method: PaymentMethod) => {
    const amountInput = document.querySelector<HTMLInputElement>('input[name="amount"]');
    const amountValue = amountInput?.value;
    if (!amountValue || parseFloat(amountValue) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    setP2pLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/deposit/p2p', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(amountValue) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء طلب P2P');

      const settingsRes = await fetch('/api/admin/settings');
      const settingsData = await settingsRes.json();
      const whatsapp = settingsData?.settings?.p2p_whatsapp || '';

      setP2pData({
        ...data,
        whatsapp,
        methodName: method.name,
      });

      // إظهار رسالة تثبيت الطلب
      toast.success('تم تثبيت طلب P2P بنجاح');
      setSuccess(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setP2pLoading(false);
    }
  };

  const onSubmit = async (data: DepositValues) => {
    // هذا خاص بالإيداع العادي (يدوي/تلقائي)
    if (!imageFile) {
      toast.error('يرجى رفع صورة إثبات الدفع');
      return;
    }
    if (!selectedMethod) {
      toast.error('يرجى اختيار طريقة الدفع');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('amount', data.amount);
      formData.append('method_id', selectedMethod);
      formData.append('reference', data.reference);
      formData.append('image', imageFile);
      formData.append('userId', userId);

      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'فشل إرسال طلب الإيداع');

      setSuccess(true);
      toast.success('تم إرسال طلب الإيداع — سيتم المراجعة خلال 15 دقيقة');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccess(false);
        reset();
        setImageFile(null);
        setImagePreview(null);
        onClose();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const normalMethods = paymentMethods.filter(m => !m.is_p2p);
  const p2pMethods = paymentMethods.filter(m => m.is_p2p);
  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-thin"
        style={{ background: '#111128', border: '1px solid rgba(108,58,255,0.3)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(108,58,255,0.15)' }}>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
          <div className="text-right">
            <h2 className="text-xl font-black text-white">إيداع رصيد</h2>
            <p className="text-xs text-gray-400">اختر طريقة الدفع وأدخل المبلغ</p>
          </div>
        </div>

        {/* حالة النجاح للإيداع العادي */}
        {success ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(0,255,148,0.15)', border: '2px solid rgba(0,255,148,0.4)' }}>
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">تم الإرسال بنجاح!</h3>
            <p className="text-gray-400">سيتم مراجعة طلبك وإضافة الرصيد خلال 15 دقيقة</p>
          </div>
        ) : p2pData ? (
          /* واجهة تفاصيل طلب P2P */
          <div className="p-6 space-y-6" dir="rtl">
            <div className="rounded-xl p-6 text-center" style={{ background: '#F0B90B10', border: '1px solid #F0B90B30' }}>
              <div className="text-4xl mb-3">🟡</div>
              <h3 className="text-xl font-bold text-white mb-2">طلب P2P - {p2pData.methodName}</h3>
              <p className="text-sm text-gray-400 mb-4">تم تثبيت طلبك بنجاح. استخدم البيانات أدناه للتواصل مع الدعم.</p>
              
              <div className="bg-dark-50 rounded-xl p-4 space-y-3 text-right">
                <div>
                  <p className="text-xs text-gray-500">رقم الطلب</p>
                  <p className="text-lg font-mono font-bold text-white">{p2pData.order_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">رقم الإيداع</p>
                  <p className="text-lg font-mono font-bold text-white">{p2pData.deposit_number}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { navigator.clipboard.writeText(p2pData.order_number); toast.success('تم نسخ رقم الطلب'); }}
                  className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-bold flex items-center justify-center gap-2"
                >
                  <Copy size={16} />
                  نسخ رقم الطلب
                </button>
                {p2pData.whatsapp && (
                  <a
                    href={`https://wa.me/${p2pData.whatsapp}?text=${encodeURIComponent('مرحباً، رقم الطلب: ' + p2pData.order_number + ' - رقم الإيداع: ' + p2pData.deposit_number)}`}
                    target="_blank"
                    className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2"
                  >
                    <Phone size={16} />
                    تواصل واتساب
                  </a>
                )}
              </div>
              <button
                onClick={() => { setP2pData(null); onClose(); }}
                className="w-full mt-3 py-2 rounded-xl bg-gray-800 text-gray-400 text-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          /* النموذج العادي */
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6" dir="rtl">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">المبلغ (USD)</label>
              <input type="number" step="0.01" min="1" placeholder="0.00" className="input-field text-right text-2xl font-black tabular-nums"
                {...register('amount', { required: 'المبلغ مطلوب', min: { value: 1, message: 'الحد الأدنى $1' } })} />
              {errors.amount && <p className="mt-1 text-xs text-red-400">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-3">طريقة الدفع</label>
              {fetchingMethods ? (
                <p className="text-gray-400 text-center py-4">جاري تحميل طرق الدفع...</p>
              ) : paymentMethods.length === 0 ? (
                <p className="text-gray-400 text-center py-4">لا توجد طرق دفع متاحة حالياً</p>
              ) : (
                <div className="space-y-4">
                  {/* طرق الدفع العادية (يدوي/تلقائي) */}
                  {normalMethods.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {normalMethods.map(m => (
                        <button key={m.id} type="button"
                          onClick={() => setSelectedMethod(m.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl text-right transition-all duration-200 hover:scale-[1.02]`}
                          style={{
                            background: selectedMethod === m.id ? '#26A17B18' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${selectedMethod === m.id ? '#26A17B' : 'rgba(255,255,255,0.08)'}`,
                          }}>
                          {/* ✅ عرض الصورة المميزة لكل طريقة دفع */}
                          {m.image_url ? (
                            <img src={m.image_url} alt={m.name} className="w-8 h-8 object-contain rounded-lg" />
                          ) : (
                            <span className="text-xl">{m.icon || (m.type === 'crypto' ? '₮' : m.type === 'local' ? '📱' : '🏦')}</span>
                          )}
                          <span className="text-sm font-semibold" style={{ color: selectedMethod === m.id ? '#26A17B' : '#9999BB' }}>{m.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* طرق P2P */}
                  {p2pMethods.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">P2P (تحويل مباشر)</p>
                      {p2pMethods.map(m => (
                        <button key={m.id} type="button"
                          onClick={() => handleP2PSubmit(m)}
                          disabled={p2pLoading}
                          className="w-full flex items-center gap-3 p-4 rounded-xl text-right transition-all duration-200 hover:scale-[1.02] mb-2 disabled:opacity-50"
                          style={{ background: '#F0B90B18', border: '1px solid #F0B90B40' }}>
                          {m.image_url ? (
                            <img src={m.image_url} alt={m.name} className="w-8 h-8 object-contain rounded-lg" />
                          ) : (
                            <span className="text-xl">🟡</span>
                          )}
                          <span className="text-sm font-semibold" style={{ color: '#F0B90B' }}>{m.name} (P2P)</span>
                          {p2pLoading && <Loader2 size={16} className="animate-spin ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* حقول إضافية للطريقة العادية */}
            {selectedMethodData && !selectedMethodData.is_p2p && (
              <>
                <div className="rounded-xl p-4 text-right" style={{ background: `rgba(38,161,123,0.1)`, border: `1px solid rgba(38,161,123,0.25)` }}>
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <AlertCircle size={14} style={{ color: '#26A17B' }} />
                    <p className="text-xs font-bold" style={{ color: '#26A17B' }}>حول المبلغ إلى هذا الحساب</p>
                  </div>
                  {selectedMethodData.account_number && (
                    <p className="font-mono text-sm text-white" dir="ltr">{selectedMethodData.account_number}</p>
                  )}
                  {selectedMethodData.barcode_image && (
                    <img src={selectedMethodData.barcode_image} alt="باركود" className="mt-2 max-h-24 mx-auto" />
                  )}
                  {selectedMethodData.instructions && (
                    <p className="text-xs text-gray-400 mt-1">{selectedMethodData.instructions}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">ثم ارفع صورة إثبات التحويل أدناه</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">رقم العملية / المرجع</label>
                  <p className="text-xs text-gray-500 mb-2">رقم العملية من رسالة التأكيد</p>
                  <input type="text" placeholder="مثال: TXN-2847364" className="input-field text-right"
                    {...register('reference', { required: 'رقم المرجع مطلوب' })} />
                  {errors.reference && <p className="mt-1 text-xs text-red-400">{errors.reference.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">صورة إثبات الدفع</label>
                  <p className="text-xs text-gray-500 mb-3">ارفع لقطة شاشة أو صورة تأكيد التحويل</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,255,148,0.3)' }}>
                      <img src={imagePreview} alt="صورة إثبات الدفع" className="w-full max-h-48 object-cover" />
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 left-2 w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ background: 'rgba(255,68,102,0.8)' }}>
                        <X size={14} />
                      </button>
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(0,255,148,0.2)', color: '#00FF94' }}>
                        <CheckCircle size={12} />
                        <span>تم الرفع</span>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="w-full rounded-xl py-10 flex flex-col items-center gap-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                      style={{ background: 'rgba(108,58,255,0.08)', border: '2px dashed rgba(108,58,255,0.3)' }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(108,58,255,0.2)' }}>
                        <Upload size={22} className="text-violet-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-violet-300">اضغط لرفع الصورة</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP — حتى 5MB</p>
                      </div>
                    </button>
                  )}
                </div>

                <button type="submit" disabled={loading || !selectedMethod}
                  className="w-full btn-primary py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ minHeight: '52px' }}>
                  {loading ? <><Loader2 size={18} className="animate-spin" /><span>جاري الإرسال...</span></> : <><ImageIcon size={18} /><span>إرسال طلب الإيداع</span></>}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}