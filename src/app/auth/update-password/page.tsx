'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // إذا كان هناك رمز في الرابط، قم باستعادة الجلسة
    const code = searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          toast.error('انتهت صلاحية الرابط أو أنه غير صالح');
          router.push('/sign-up-login-screen');
        } else {
          setHasSession(true);
        }
      });
    } else {
      // تحقق مما إذا كانت هناك جلسة موجودة
      supabase.auth.getSession().then(({ data: { session } }) => {
        setHasSession(!!session);
      });
    }
  }, [searchParams, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('تم تحديث كلمة المرور بنجاح');
      router.push('/sign-up-login-screen');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-dark-50" dir="rtl">
      <form onSubmit={handleUpdate} className="w-full max-w-md p-8 rounded-2xl bg-dark-50 border border-violet-500/20">
        <h1 className="text-2xl font-bold text-white mb-6">تعيين كلمة مرور جديدة</h1>
        
        {hasSession ? (
          <>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور الجديدة"
              required
              minLength={6}
              className="w-full p-3 rounded-lg bg-dark-100 border border-gray-700 text-white mb-4"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
            </button>
          </>
        ) : (
          <p className="text-gray-400 text-center">جارٍ التحقق من الرابط...</p>
        )}
      </form>
    </div>
  );
}