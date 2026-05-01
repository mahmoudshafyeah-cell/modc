'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, ArrowLeftRight, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TransferValues {
  amount: string;
  recipient: string;
  note: string;
}

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

export default function TransferModal({ open, onClose, userId, onSuccess }: TransferModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransferValues>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (data: TransferValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: parseFloat(data.amount),
          recipient: data.recipient,
          note: data.note,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'فشل التحويل');
      setSuccess(true);
      toast.success('تم التحويل بنجاح');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccess(false);
        reset();
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
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden animate-slide-up"
        style={{
          background: '#111128',
          border: '1px solid rgba(255,184,0,0.3)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,184,0,0.15)' }}>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>
          <div className="text-right">
            <h2 className="text-xl font-black text-white">تحويل رصيد</h2>
            <p className="text-xs text-gray-400">تحويل إلى مستخدم آخر</p>
          </div>
        </div>

        {success ? (
          <div className="p-12 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(0,255,148,0.15)', border: '2px solid rgba(0,255,148,0.4)' }}
            >
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">تم التحويل!</h3>
            <p className="text-gray-400">تمت عملية التحويل بنجاح</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5" dir="rtl">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">المبلغ (USD)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="0.00"
                className="input-field text-right text-2xl font-black tabular-nums"
                {...register('amount', { required: 'المبلغ مطلوب', min: { value: 1, message: 'الحد الأدنى $1' } })}
              />
              {errors.amount && <p className="mt-1 text-xs text-red-400">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">المستلم</label>
              <input
                type="text"
                placeholder="البريد الإلكتروني أو معرف المحفظة"
                className="input-field text-right"
                {...register('recipient', { required: 'المستلم مطلوب' })}
              />
              {errors.recipient && <p className="mt-1 text-xs text-red-400">{errors.recipient.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">ملاحظة (اختياري)</label>
              <input
                type="text"
                placeholder="ملاحظة..."
                className="input-field text-right"
                {...register('note')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #FFB800, #FF6B00)',
                boxShadow: '0 4px 20px rgba(255,184,0,0.35)',
                color: 'white',
                minHeight: '52px',
              }}
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /><span>جاري التحويل...</span></>
              ) : (
                <><ArrowLeftRight size={18} /><span>تحويل الآن</span></>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}