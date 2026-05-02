'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import bcrypt from 'bcryptjs';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('كلمتا المرور غير متطابقتين');
    if (newPassword.length < 6) return toast.error('كلمة المرور 6 أحرف على الأقل');

    setLoading(true);
    // جلب المستخدم الحالي من Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      toast.error('يرجى تسجيل الدخول أولاً');
      setLoading(false);
      return;
    }
    // لتغيير كلمة المرور عبر Auth، نستخدم updateUser
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else toast.success('تم تغيير كلمة المرور بنجاح');
    setLoading(false);
  };

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold text-white mb-6">تغيير كلمة المرور</h1>
        <form onSubmit={handleSubmit} className="bg-dark-100 rounded-xl p-6 border border-gray-800 space-y-4">
          <input type="password" placeholder="كلمة المرور الحالية" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
          <input type="password" placeholder="كلمة المرور الجديدة" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
          <input type="password" placeholder="تأكيد كلمة المرور الجديدة" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
          <button type="submit" disabled={loading} className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"><Save size={18} /> {loading ? 'جاري...' : 'تغيير كلمة المرور'}</button>
        </form>
      </div>
    </AuthGuard>
  );
}