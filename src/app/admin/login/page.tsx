'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Lock, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // التحقق من الدور من جدول profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || profile?.role !== 'super_admin') {
        await supabase.auth.signOut();
        toast.error('غير مصرح لك بالدخول إلى لوحة التحكم');
        return;
      }

      localStorage.setItem('auth_token', data.session.access_token);
      toast.success('مرحباً مدير النظام');
      router.push('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md bg-dark-100 rounded-2xl shadow-xl border border-gray-700 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-cyan-600 rounded-2xl flex items-center justify-center mb-4">
            <Lock size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">دخول المدير</h1>
          <p className="text-gray-400 text-sm mt-2">الرجاء إدخال بيانات الاعتماد الخاصة بك</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-300 mb-2 text-sm">البريد الإلكتروني</label>
            <div className="relative">
              <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 pr-10 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-cyan-500 outline-none"
                placeholder="admin@modc.sy"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm">كلمة المرور</label>
            <div className="relative">
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-10 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-cyan-500 outline-none"
                placeholder="••••••••"
                required
              />
            </div>
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