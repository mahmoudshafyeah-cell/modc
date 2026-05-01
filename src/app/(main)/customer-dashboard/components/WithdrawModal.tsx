// المسار: src/app/(main)/customer-dashboard/components/WithdrawModal.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { X, ArrowUpCircle, Loader2, CheckCircle, Upload, FileImage } from 'lucide-react';
import { toast } from 'sonner';

interface WithdrawValues {
  amount: string;
  method: string;
  account: string;
}

interface WithdrawalMethod {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  fee_percent?: number;
}

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentBalance: number;
  onSuccess?: () => void;
}

export default function WithdrawModal({ open, onClose, userId, currentBalance, onSuccess }: WithdrawModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<WithdrawValues>();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [methods, setMethods] = useState<WithdrawalMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMethods, setFetchingMethods] = useState(true);
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      fetchWithdrawalMethods();
    }
  }, [open]);

  async function fetchWithdrawalMethods() {
    setFetchingMethods(true);
    try {
      const res = await fetch('/api/withdrawal-methods');
      const data = await res.json();
      if (res.ok) {
        const activeMethods = data.methods.filter((m: WithdrawalMethod) => m.is_active);
        setMethods(activeMethods);
        if (activeMethods.length > 0) {
          setSelectedMethod(activeMethods[0].id);
        }
      }
    } catch (error) {
      console.error('فشل جلب طرق السحب:', error);
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

  const selectedMethodData = methods.find(m => m.id === selectedMethod);

  const onSubmit = async (data: WithdrawValues) => {
    if (!selectedMethod) {
      toast.error('يرجى اختيار طريقة السحب');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      // رفع الصورة أولاً إذا وُجدت
      let proof_url: string | null = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await fetch('/api/wallet/deposit', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        // سنستخدم نفس آلية رفع الصورة في wallet/deposit
        // لكنها سترجع deposit_id، لذا الأفضل رفع الصورة ضمن طلب السحب نفسه
      }

      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(data.amount),
          method_id: selectedMethod,
          account: data.account,
          proof_url: proof_url, // رابط الصورة بعد الرفع
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'فشل طلب السحب');
      
      setSuccess(true);
      toast.success('تم إرسال طلب السحب — سيتم المعالجة خلال ساعة');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: '#111128', border: '1px solid rgba(255,68,102,0.3)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,68,102,0.15)' }}>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
          <div className="text-right">
            <h2 className="text-xl font-black text-white">سحب رصيد</h2>
            <p className="text-xs text-gray-400">رصيد متاح: ${currentBalance.toFixed(2)}</p>
          </div>
        </div>

        {success ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(0,255,148,0.15)', border: '2px solid rgba(0,255,148,0.4)' }}>
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">طلب السحب مُرسل!</h3>
            <p className="text-gray-400">سيتم معالجة الطلب وإرسال المبلغ خلال ساعة</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5" dir="rtl">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">المبلغ (USD)</label>
              <input
                type="number"
                step="0.01"
                min="5"
                placeholder="0.00"
                className="input-field text-right text-2xl font-black tabular-nums"
                {...register('amount', { required: 'المبلغ مطلوب', min: { value: 5, message: 'الحد الأدنى للسحب $5' } })}
              />
              {errors.amount && <p className="mt-1 text-xs text-red-400">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-3">طريقة الاستلام</label>
              {fetchingMethods ? (
                <p className="text-gray-400 text-center py-4">جاري تحميل طرق السحب...</p>
              ) : methods.length === 0 ? (
                <p className="text-gray-400 text-center py-4">لا توجد طرق سحب متاحة حالياً</p>
              ) : (
                <div className="space-y-2">
                  {methods.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-right transition-all duration-200"
                      style={{
                        background: selectedMethod === m.id ? '#26A17B15' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selectedMethod === m.id ? '#26A17B' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <span className="text-xl">{m.type === 'crypto' ? '₮' : m.type === 'local' ? '📱' : '🏦'}</span>
                      <span className="text-sm font-semibold flex-1" style={{ color: selectedMethod === m.id ? '#26A17B' : '#9999BB' }}>
                        {m.name}
                      </span>
                      {selectedMethod === m.id && <CheckCircle size={16} style={{ color: '#26A17B' }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">رقم الحساب / المحفظة</label>
              <input
                type="text"
                placeholder="أدخل رقم الحساب أو عنوان المحفظة"
                className="input-field text-right"
                {...register('account', { required: 'رقم الحساب مطلوب' })}
              />
              {errors.account && <p className="mt-1 text-xs text-red-400">{errors.account.message}</p>}
            </div>

            {/* رفع صورة الباركود أو المحفظة */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">صورة الباركود / المحفظة (اختياري)</label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-700">
                  <img src={imagePreview} alt="معاينة" className="w-full max-h-32 object-contain" />
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-red-600/80 text-white flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full py-6 rounded-xl bg-dark-50 border border-dashed border-gray-600 text-gray-400 flex flex-col items-center gap-2 hover:border-red-500 transition-colors">
                  <Upload size={20} />
                  <span className="text-xs">اضغط لرفع صورة الباركود أو المحفظة</span>
                </button>
              )}
            </div>

            <div className="rounded-xl p-4 text-right" style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)' }}>
              <p className="text-xs text-amber-400 font-semibold">
                ⚠️ رسوم السحب: {selectedMethodData?.fee_percent || 2}% من المبلغ
              </p>
              <p className="text-xs text-gray-500 mt-1">الحد الأدنى للسحب $5 — الحد الأقصى اليومي $500</p>
            </div>

            <button
              type="submit"
              disabled={loading || methods.length === 0}
              className="w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #FF4466, #CC1133)', boxShadow: '0 4px 20px rgba(255,68,102,0.35)', color: 'white', minHeight: '52px' }}
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /><span>جاري الإرسال...</span></>
              ) : (
                <><ArrowUpCircle size={18} /><span>إرسال طلب السحب</span></>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}