'use client';
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  Shield,
  Camera,
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  FileCheck,
  BadgeCheck,
  Key,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface KYCData {
  id?: string;
  full_name_ar: string;
  national_id: string;
  id_front_url: string | null;
  id_back_url: string | null;
  selfie_front_url: string | null;
  selfie_back_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  submitted_at?: string;
  rejection_reason?: string;
}

export default function AgentSecurity({
  userData,
  onAvatarUpdated,
}: {
  userData: any;
  onAvatarUpdated?: (url: string) => void;
}) {
  const [kyc, setKyc] = useState<KYCData>({
    full_name_ar: '',
    national_id: '',
    id_front_url: null,
    id_back_url: null,
    selfie_front_url: null,
    selfie_back_url: null,
    status: 'not_submitted',
  });
  const [kycLoading, setKycLoading] = useState(true);
  const [kycSubmitting, setKycSubmitting] = useState(false);

  const [has2FA, setHas2FA] = useState(false);
  const [checking2FA, setChecking2FA] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(userData?.avatar_url || null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const frontIdRef = useRef<HTMLInputElement>(null);
  const backIdRef = useRef<HTMLInputElement>(null);
  const selfieFrontRef = useRef<HTMLInputElement>(null);
  const selfieBackRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchKYCStatus();
    check2FAStatus();
  }, []);

  async function apiCall(url: string, method = 'GET', body?: any, isFormData = false) {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (!isFormData && body) headers['Content-Type'] = 'application/json';
    const res = await fetch(url, { method, headers, body: isFormData ? body : body ? JSON.stringify(body) : undefined });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشلت العملية');
    return data;
  }

  async function fetchKYCStatus() {
    try {
      const data = await apiCall('/api/agent/kyc-status');
      if (data.kyc) {
        const k = data.kyc;
        setKyc({
          id: k.id,
          full_name_ar: k.full_name_ar || '',
          national_id: k.national_id || '',
          id_front_url: k.id_front_url || null,
          id_back_url: k.id_back_url || null,
          selfie_front_url: k.selfie_front_url || null,
          selfie_back_url: k.selfie_back_url || null,
          status: k.status || 'not_submitted',
          submitted_at: k.submitted_at,
          rejection_reason: k.rejection_reason,
        });
      }
    } catch (e) {
      console.error('فشل جلب KYC:', e);
    } finally {
      setKycLoading(false);
    }
  }

  async function check2FAStatus() {
    try {
      const data = await apiCall('/api/agent/2fa/status');
      setHas2FA(data.has2FA);
    } catch (e) {
      console.error('فشل جلب 2FA:', e);
    } finally {
      setChecking2FA(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await apiCall('/api/agent/upload-avatar', 'POST', formData, true);
      setAvatarUrl(data.avatarUrl);
      if (onAvatarUpdated) onAvatarUpdated(data.avatarUrl); // <-- هذا السطر ضروري
      toast.success('تم تحديث الصورة الشخصية');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function uploadKYCImage(file: File, type: string): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      const data = await apiCall('/api/agent/upload-kyc-image', 'POST', formData, true);
      toast.success(`تم رفع ${type} بنجاح`);
      return data.url;
    } catch (error: any) {
      toast.error(error.message);
      return null;
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, field: keyof KYCData, type: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadKYCImage(file, type).then(url => {
      if (url) setKyc(prev => ({ ...prev, [field]: url }));
    });
  }

  async function submitKYC() {
    if (!kyc.full_name_ar.trim() || !kyc.national_id.trim()) {
      toast.error('يرجى إدخال الاسم الثلاثي والرقم الوطني');
      return;
    }
    if (kyc.national_id.length < 11) {
      toast.error('الرقم الوطني يجب أن يكون 11 خانة');
      return;
    }
    if (!kyc.id_front_url || !kyc.id_back_url || !kyc.selfie_front_url || !kyc.selfie_back_url) {
      toast.error('يرجى رفع جميع الصور المطلوبة');
      return;
    }
    setKycSubmitting(true);
    try {
      await apiCall('/api/agent/submit-kyc', 'POST', {
        full_name_ar: kyc.full_name_ar,
        national_id: kyc.national_id,
        id_front_url: kyc.id_front_url,
        id_back_url: kyc.id_back_url,
        selfie_front_url: kyc.selfie_front_url,
        selfie_back_url: kyc.selfie_back_url,
      });
      setKyc(prev => ({ ...prev, status: 'pending', submitted_at: new Date().toISOString() }));
      toast.success('تم تقديم طلب التحقق بنجاح - سيتم مراجعته قريباً');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setKycSubmitting(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }
    if (password.length < 6) {
      toast.error('كلمة المرور 6 أحرف على الأقل');
      return;
    }
    setPasswordLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('يجب تسجيل الدخول');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('تم تغيير كلمة المرور بنجاح');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleToggle2FA() {
    try {
      if (has2FA) {
        await apiCall('/api/agent/2fa/unenroll', 'POST');
        setHas2FA(false);
        toast.success('تم تعطيل المصادقة الثنائية');
      } else {
        const enrollData = await apiCall('/api/agent/2fa/enroll', 'POST');
        const code = prompt('افتح تطبيق المصادقة وأدخل الرمز. الكود السري: ' + enrollData.secret);
        if (!code) return;
        const challengeData = await apiCall('/api/agent/2fa/challenge', 'POST', { factorId: enrollData.id });
        await apiCall('/api/agent/2fa/verify', 'POST', {
          factorId: enrollData.id,
          challengeId: challengeData.challengeId,
          code,
        });
        setHas2FA(true);
        toast.success('تم تفعيل المصادقة الثنائية');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const renderKYCStatusBadge = () => {
    const config: Record<string, { icon: React.ReactNode; color: string; bg: string; text: string; desc: string }> = {
      not_submitted: { icon: <AlertCircle size={40} />, color: '#FFB800', bg: 'rgba(255,184,0,0.1)', text: 'لم يتم التقديم', desc: 'قم بتعبئة النموذج ورفع المستندات المطلوبة' },
      pending: { icon: <Clock size={40} />, color: '#FFB800', bg: 'rgba(255,184,0,0.1)', text: 'قيد المراجعة', desc: 'طلبك قيد المراجعة من قبل الإدارة' },
      approved: { icon: <BadgeCheck size={40} />, color: '#00FF94', bg: 'rgba(0,255,148,0.1)', text: 'تم التحقق', desc: 'تم التحقق من هويتك بنجاح' },
      rejected: { icon: <X size={40} />, color: '#FF4466', bg: 'rgba(255,68,102,0.1)', text: 'مرفوض', desc: kyc.rejection_reason || 'تم رفض طلب التحقق. يرجى إعادة التقديم' },
    };
    const c = config[kyc.status] || config.not_submitted;
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: c.bg, border: `1px solid ${c.color}30` }}>
        <div className="flex justify-center mb-3" style={{ color: c.color }}>{c.icon}</div>
        <h3 className="text-xl font-black text-white mb-2">{c.text}</h3>
        <p className="text-gray-400 text-sm">{c.desc}</p>
      </div>
    );
  };

  const renderImagePreview = (url: string | null, label: string, inputRef: React.RefObject<HTMLInputElement | null>, field: keyof KYCData, type: string) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-200">{label}</label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, field, type)} />
      {url ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-700">
          <img src={url} alt={label} className="w-full h-40 object-cover" />
          {(kyc.status === 'not_submitted' || kyc.status === 'rejected') && (
            <button type="button" onClick={() => setKyc(prev => ({ ...prev, [field]: null }))} className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-red-600/80 text-white flex items-center justify-center"><X size={14} /></button>
          )}
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg text-xs bg-green-600/80 text-white"><CheckCircle size={12} className="inline mr-1" />تم الرفع</div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="w-full py-10 rounded-xl flex flex-col items-center gap-2 transition-all hover:border-cyan-500" style={{ background: 'rgba(12, 113, 178, 0.05)', border: '2px dashed rgba(12, 113, 178, 0.3)' }}>
          <Upload size={24} style={{ color: '#0c71b2' }} /><span className="text-sm text-gray-400">{label}</span>
        </button>
      )}
    </div>
  );

  if (kycLoading || checking2FA) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8" dir="rtl">
      {/* الصورة الشخصية */}
      <div className="rounded-2xl p-6" style={{ background: '#111128', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Camera size={24} style={{ color: '#0c71b2' }} />الصورة الشخصية</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            {avatarUrl ? <img src={avatarUrl} className="w-24 h-24 rounded-full object-cover ring-2 ring-cyan-500/50" /> : <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #0c71b2, #00D4FF)', color: 'white' }}>{(userData?.full_name || 'و').charAt(0)}</div>}
            <button onClick={() => avatarRef.current?.click()} className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white">{avatarUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}</button>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <div><p className="text-white font-medium">تحديث الصورة الشخصية</p><p className="text-xs text-gray-400 mt-1">JPG, PNG (حتى 2MB)</p></div>
        </div>
      </div>

      {/* KYC */}
      <div className="rounded-2xl p-6" style={{ background: '#111128', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-6"><FileCheck size={24} style={{ color: '#0c71b2' }} /><h2 className="text-xl font-bold text-white">تحقق الهوية (KYC)</h2></div>
        {renderKYCStatusBadge()}
        {(kyc.status === 'not_submitted' || kyc.status === 'rejected') && (
          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold text-gray-200 mb-2">الاسم الثلاثي (بالعربية)</label><input type="text" value={kyc.full_name_ar} onChange={e => setKyc(prev => ({ ...prev, full_name_ar: e.target.value }))} className="input-field text-right w-full" /></div>
              <div><label className="block text-sm font-semibold text-gray-200 mb-2">الرقم الوطني (11 خانة)</label><input type="text" value={kyc.national_id} onChange={e => setKyc(prev => ({ ...prev, national_id: e.target.value }))} maxLength={11} className="input-field text-right w-full" dir="ltr" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderImagePreview(kyc.id_front_url, 'صورة الهوية من الأمام', frontIdRef, 'id_front_url', 'أمام')}
              {renderImagePreview(kyc.id_back_url, 'صورة الهوية من الخلف', backIdRef, 'id_back_url', 'خلف')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderImagePreview(kyc.selfie_front_url, 'سيلفي مع الهوية (الأمام)', selfieFrontRef, 'selfie_front_url', 'سيلفي-أمام')}
              {renderImagePreview(kyc.selfie_back_url, 'سيلفي مع الهوية (الخلف)', selfieBackRef, 'selfie_back_url', 'سيلفي-خلف')}
            </div>
            <button onClick={submitKYC} disabled={kycSubmitting} className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #0c71b2, #00D4FF)', boxShadow: '0 4px 20px rgba(12, 113, 178, 0.3)' }}>{kycSubmitting ? <><Loader2 size={18} className="animate-spin" />جاري التقديم...</> : <><BadgeCheck size={18} />تقديم طلب التحقق</>}</button>
          </div>
        )}
      </div>

      {/* تغيير كلمة المرور */}
      <div className="rounded-2xl p-6" style={{ background: '#111128', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-6"><Key size={24} style={{ color: '#0c71b2' }} /><h2 className="text-xl font-bold text-white">تغيير كلمة المرور</h2></div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div><label className="block text-sm text-gray-300 mb-2">كلمة المرور الجديدة</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field text-right w-full" required minLength={6} /></div>
          <div><label className="block text-sm text-gray-300 mb-2">تأكيد كلمة المرور</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field text-right w-full" required /></div>
          <button type="submit" disabled={passwordLoading} className="w-full py-3 rounded-xl font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #0c71b2, #00D4FF)' }}>{passwordLoading ? 'جاري التحديث...' : 'تغيير كلمة المرور'}</button>
        </form>
      </div>

      {/* 2FA */}
      <div className="rounded-2xl p-6" style={{ background: '#111128', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-6"><Shield size={24} style={{ color: '#0c71b2' }} /><h2 className="text-xl font-bold text-white">المصادقة الثنائية (2FA)</h2></div>
        <p className="text-gray-400 text-sm mb-6">أضف طبقة أمان إضافية لحسابك باستخدام تطبيق المصادقة (Google Authenticator)</p>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(12, 113, 178, 0.08)', border: '1px solid rgba(12, 113, 178, 0.2)' }}>
          <span className={`text-sm font-bold ${has2FA ? 'text-green-400' : 'text-gray-400'}`}>{has2FA ? '✅ مفعلة' : '❌ غير مفعلة'}</span>
          <button onClick={handleToggle2FA} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${has2FA ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-white'}`} style={!has2FA ? { background: 'linear-gradient(135deg, #0c71b2, #00D4FF)' } : {}}>{has2FA ? 'تعطيل المصادقة الثنائية' : 'تفعيل المصادقة الثنائية'}</button>
        </div>
      </div>
    </div>
  );
}