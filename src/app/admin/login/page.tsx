// src/app/admin/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        toast.error(error.message || 'فشل تسجيل الدخول');
        setLoading(false);
        return;
      }

      if (!data.session) {
        toast.error('لم يتم استلام جلسة المصادقة');
        setLoading(false);
        return;
      }

      // تخزين التوكن فقط (بدون التحقق من الدور)
      localStorage.setItem('auth_token', data.session.access_token);
      localStorage.setItem('user_role', 'super_admin'); // تجاوز مؤقت للاختبار
      
      toast.success('تم تسجيل الدخول بنجاح');
      router.push('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ غير متوقع');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md bg-dark-100 rounded-2xl shadow-xl border border-gray-700 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">دخول المدير</h1>
          <p className="text-gray-400 text-sm mt-2">الرجاء إدخال بيانات الاعتماد الخاصة بك</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-300 mb-2 text-sm">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-cyan-500 outline-none"
              placeholder="admin@modc.sy"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-cyan-500 outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition disabled:opacity-50"
          >
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}