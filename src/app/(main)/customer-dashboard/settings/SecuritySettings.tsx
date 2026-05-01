'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createAuthenticatedClient } from '@/lib/supabase';

export default function SecuritySettings() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [has2FA, setHas2FA] = useState(false);
  const [checking2FA, setChecking2FA] = useState(true);
  const [is2FAEnabledGlobally, setIs2FAEnabledGlobally] = useState(true);

  useEffect(() => {
    checkGlobalSetting();
    check2FAStatus();
  }, []);

  async function checkGlobalSetting() {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      setIs2FAEnabledGlobally(data.settings?.enable_2fa !== false);
    } catch {}
  }

  async function check2FAStatus() {
    try {
      const supabaseAuth = createAuthenticatedClient();
      const { data: factors } = await supabaseAuth.auth.mfa.listFactors();
      setHas2FA(factors?.totp.length > 0);
    } catch (error) {
      console.error('فشل جلب حالة 2FA:', error);
    } finally {
      setChecking2FA(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }
    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setLoading(true);
    try {
      const supabase = createAuthenticatedClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('تم تغيير كلمة المرور بنجاح');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle2FA() {
    try {
      const supabaseAuth = createAuthenticatedClient();
      if (has2FA) {
        // تعطيل 2FA
        const { data: factors } = await supabaseAuth.auth.mfa.listFactors();
        const factor = factors?.totp[0];
        if (factor) {
          const { error } = await supabaseAuth.auth.mfa.unenroll({ factorId: factor.id });
          if (error) throw error;
          toast.success('تم تعطيل المصادقة الثنائية');
          setHas2FA(false);
        }
      } else {
        // تفعيل 2FA
        const { data, error } = await supabaseAuth.auth.mfa.enroll({ factorType: 'totp' });
        if (error) throw error;
        
        // فتح نافذة QR Code للتفعيل
        const code = prompt('افتح تطبيق المصادقة وأدخل الرمز الظاهر بعد مسح QR. الكود السري: ' + data.totp.secret);
        if (!code) return;

        const { data: challenge, error: challengeError } = await supabaseAuth.auth.mfa.challenge({ factorId: data.id });
        if (challengeError) throw challengeError;

        const { error: verifyError } = await supabaseAuth.auth.mfa.verify({
          factorId: data.id,
          challengeId: challenge.id,
          code,
        });
        if (verifyError) throw verifyError;

        toast.success('تم تفعيل المصادقة الثنائية بنجاح');
        setHas2FA(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* تغيير كلمة المرور */}
      <form onSubmit={handlePasswordChange} className="bg-dark-100 p-6 rounded-xl border border-gray-700 space-y-4">
        <h3 className="text-lg font-bold text-white mb-2">تغيير كلمة المرور</h3>
        <div>
          <label className="block text-white mb-2">كلمة المرور الجديدة</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-white mb-2">تأكيد كلمة المرور</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold disabled:opacity-50 hover:bg-violet-700 transition-colors"
        >
          {loading ? 'جاري التحديث...' : 'تغيير كلمة المرور'}
        </button>
      </form>

      {/* المصادقة الثنائية */}
      {!checking2FA && is2FAEnabledGlobally && (
        <div className="bg-dark-100 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">المصادقة الثنائية (2FA)</h3>
          <p className="text-gray-400 text-sm mb-4">
            أضف طبقة أمان إضافية لحسابك باستخدام تطبيق المصادقة (Google Authenticator)
          </p>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${has2FA ? 'text-green-400' : 'text-gray-400'}`}>
              {has2FA ? 'مفعلة ✅' : 'غير مفعلة'}
            </span>
            <button
              onClick={handleToggle2FA}
              className={`px-6 py-2.5 rounded-xl text-white font-bold transition-colors ${
                has2FA
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-violet-600 hover:bg-violet-700'
              }`}
            >
              {has2FA ? 'تعطيل المصادقة الثنائية' : 'تفعيل المصادقة الثنائية'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}