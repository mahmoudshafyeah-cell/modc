'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Key, X } from 'lucide-react';

export default function SecurityPage() {
  const [has2FA, setHas2FA] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [is2FAEnabledGlobally, setIs2FAEnabledGlobally] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const fetch2FAStatus = async () => {
    try {
      const res = await fetch('/api/user/2fa', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setHas2FA(data.has2FA);
    } catch {
      toast.error('فشل جلب حالة المصادقة');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      setIs2FAEnabledGlobally(data.settings?.enable_2fa !== false);
    } catch {}
  };

  useEffect(() => {
    fetchGlobalSettings();
    fetch2FAStatus();
  }, []);

  const enroll2FA = async () => {
    try {
      const res = await fetch('/api/user/2fa', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFactorId(data.factorId);
      setQrCode(data.qr_code);
      setSecret(data.secret);
      setShowEnrollModal(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const verifyAndActivate = async () => {
    if (!factorId || !verifyCode) return;
    try {
      const res = await fetch('/api/user/2fa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ factorId, code: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم تفعيل المصادقة الثنائية');
      setShowEnrollModal(false);
      setHas2FA(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const disable2FA = async () => {
    if (!confirm('هل أنت متأكد من تعطيل المصادقة الثنائية؟')) return;
    try {
      const res = await fetch('/api/user/2fa', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم التعطيل');
      setHas2FA(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  if (!is2FAEnabledGlobally) {
    return (
      <div className="p-6 max-w-md mx-auto" dir="rtl">
        <h2 className="text-2xl font-bold text-white mb-6">إعدادات الأمان</h2>
        <div className="bg-dark-100 p-6 rounded-xl border border-gray-700 text-center">
          <Shield size={48} className="mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400">المصادقة الثنائية غير مفعلة حالياً من قبل الإدارة.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto" dir="rtl">
      <h2 className="text-2xl font-bold text-white mb-6">إعدادات الأمان</h2>
      <div className="bg-dark-100 p-6 rounded-xl border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center">
            <Key size={24} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">المصادقة الثنائية</h3>
            <p className="text-gray-400 text-sm">أضف طبقة أمان إضافية لحسابك</p>
          </div>
        </div>
        {has2FA ? (
          <div>
            <p className="text-green-400 mb-4 flex items-center gap-2">
              <Shield size={18} /> المصادقة الثنائية مفعلة
            </p>
            <button onClick={disable2FA} className="w-full py-3 rounded-xl bg-red-600 text-white font-bold">
              تعطيل المصادقة الثنائية
            </button>
          </div>
        ) : (
          <button onClick={enroll2FA} className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold">
            تفعيل المصادقة الثنائية
          </button>
        )}
      </div>

      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowEnrollModal(false)}>
          <div className="bg-dark-100 rounded-2xl p-6 w-full max-w-md border border-violet-500/30" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">تفعيل المصادقة الثنائية</h3>
              <button onClick={() => setShowEnrollModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-white mb-2">1. امسح رمز QR باستخدام تطبيق المصادقة</p>
            {qrCode && <QRCodeSVG value={qrCode} size={200} className="mx-auto my-4" />}
            <p className="text-gray-400 text-sm mb-4">أو أدخل هذا الكود يدوياً: <span className="font-mono text-white">{secret}</span></p>
            <p className="text-white mb-2">2. أدخل الرمز الظاهر في التطبيق</p>
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="رمز التحقق"
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white mb-4"
            />
            <button onClick={verifyAndActivate} className="w-full py-3 rounded-xl bg-green-600 text-white font-bold">
              تأكيد التفعيل
            </button>
          </div>
        </div>
      )}
    </div>
  );
}