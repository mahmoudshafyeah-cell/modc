'use client';
import { useState, useEffect, useRef } from 'react';
import { Shield, Key, User, Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { createAuthenticatedClient } from '@/lib/supabase';

export default function AgentSettings({ userData }: { userData: any }) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'about'>('profile');
  const [fullName, setFullName] = useState(userData?.full_name || '');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [has2FA, setHas2FA] = useState(false);
  const [checking2FA, setChecking2FA] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
    check2FA();
  }, []);

  async function fetchProfile() {
    const supabase = createAuthenticatedClient();
    const { data } = await supabase.from('profiles').select('full_name, phone, avatar_url').eq('id', userData.id).single();
    if (data) {
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
      setAvatarUrl(data.avatar_url || null);
    }
  }

  async function check2FA() {
    const supabase = createAuthenticatedClient();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    setHas2FA(factors?.totp.length > 0);
    setChecking2FA(false);
  }

  async function handleAvatarUpload(file: File): Promise<string | null> {
    const supabase = createAuthenticatedClient();
    const fileName = `${userData.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
    if (uploadError) { toast.error('فشل رفع الصورة'); return null; }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      let newAvatarUrl = avatarUrl;
      if (imageFile) {
        const url = await handleAvatarUpload(imageFile);
        if (url) newAvatarUrl = url;
      }
      const supabase = createAuthenticatedClient();
      const { error } = await supabase.from('profiles').update({
        full_name: fullName,
        phone,
        avatar_url: newAvatarUrl,
      }).eq('id', userData.id);
      if (error) throw error;
      toast.success('تم تحديث الملف الشخصي');
      setImageFile(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error('كلمتا المرور غير متطابقتين'); return; }
    if (password.length < 6) { toast.error('كلمة المرور 6 أحرف على الأقل'); return; }
    setLoadingPassword(true);
    const supabase = createAuthenticatedClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else {
      toast.success('تم تغيير كلمة المرور');
      setPassword('');
      setConfirmPassword('');
    }
    setLoadingPassword(false);
  }

  async function toggle2FA() {
    const supabase = createAuthenticatedClient();
    if (has2FA) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp[0];
      if (!factor) return;
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (error) toast.error(error.message);
      else { toast.success('تم تعطيل المصادقة الثنائية'); setHas2FA(false); }
    } else {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) { toast.error(error.message); return; }
      const code = prompt('افتح تطبيق المصادقة وأدخل الرمز الظاهر بعد مسح QR. الكود السري: ' + data.totp.secret);
      if (!code) return;
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: data.id });
      if (challengeError) { toast.error(challengeError.message); return; }
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: data.id, challengeId: challenge.id, code });
      if (verifyError) toast.error(verifyError.message);
      else { toast.success('تم تفعيل المصادقة الثنائية'); setHas2FA(true); }
    }
  }

  return (
    <div className="space-y-6 max-w-2xl" dir="rtl">
      <h1 className="text-2xl font-black text-white">الإعدادات</h1>

      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: 'profile', label: 'الملف الشخصي', icon: User },
          { id: 'security', label: 'الأمان', icon: Shield },
          { id: 'about', label: 'حول', icon: Key },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileUpdate} className="bg-dark-100 p-6 rounded-xl border border-gray-700 space-y-4">
          <h3 className="text-lg font-bold text-white mb-2">الملف الشخصي</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-violet-600/30 flex items-center justify-center overflow-hidden border-2 border-violet-500">
                {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <Camera size={32} className="text-violet-400" />}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 left-0 w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white">
                <Upload size={12} />
              </button>
              <input type="file" ref={fileRef} className="hidden" accept="image/*"
                onChange={e => { const file = e.target.files?.[0]; if (file) setImageFile(file); }} />
            </div>
            <div>
              <p className="text-white font-medium">الصورة الشخصية</p>
              <p className="text-xs text-gray-400">JPG, PNG (حتى 2MB)</p>
            </div>
          </div>
          <div>
            <label className="block text-white mb-2">الاسم الكامل</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
          </div>
          <div>
            <label className="block text-white mb-2">رقم الهاتف</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" dir="ltr" />
          </div>
          <button type="submit" disabled={loadingProfile} className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold disabled:opacity-50">
            {loadingProfile ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </form>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <form onSubmit={handlePasswordChange} className="bg-dark-100 p-6 rounded-xl border border-gray-700 space-y-4">
            <h3 className="text-lg font-bold text-white">تغيير كلمة المرور</h3>
            <div>
              <label className="block text-white mb-2">كلمة المرور الجديدة</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required minLength={6} />
            </div>
            <div>
              <label className="block text-white mb-2">تأكيد كلمة المرور</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
            </div>
            <button type="submit" disabled={loadingPassword} className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold disabled:opacity-50">
              {loadingPassword ? 'جاري التحديث...' : 'تغيير كلمة المرور'}
            </button>
          </form>

          {!checking2FA && (
            <div className="bg-dark-100 p-6 rounded-xl border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">المصادقة الثنائية (2FA)</h3>
              <p className="text-gray-400 text-sm mb-4">أضف طبقة أمان إضافية لحسابك باستخدام تطبيق المصادقة.</p>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${has2FA ? 'text-green-400' : 'text-gray-400'}`}>
                  {has2FA ? 'مفعلة ✅' : 'غير مفعلة'}
                </span>
                <button onClick={toggle2FA} className={`px-6 py-2.5 rounded-xl text-white font-bold ${has2FA ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700'}`}>
                  {has2FA ? 'تعطيل المصادقة الثنائية' : 'تفعيل المصادقة الثنائية'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'about' && (
        <div className="bg-dark-100 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">حول المنصة</h3>
          <p className="text-gray-400">
            لوحة تحكم الوكيل – منصة ModC. يمكنك شراء المنتجات بسعر الجملة وإعادة بيعها لعملائك، مع تتبع أرباحك ومبيعاتك.
          </p>
          <p className="text-gray-500 text-sm mt-4">الإصدار 1.0.0</p>
        </div>
      )}
    </div>
  );
}