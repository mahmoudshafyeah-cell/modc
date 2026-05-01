'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function TwoFactorPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const userId = typeof window !== 'undefined' ? sessionStorage.getItem('2fa_userId') : null;

  if (!userId) {
    router.push('/sign-up-login-screen');
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'رمز التحقق غير صحيح');

      localStorage.setItem('auth_token', result.token);
      sessionStorage.removeItem('2fa_userId');
      toast.success('تم تسجيل الدخول بنجاح');
      window.location.href = result.redirectPath;
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-dark-50" dir="rtl">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 rounded-2xl bg-dark-100 border border-violet-500/20">
        <h1 className="text-2xl font-bold text-white mb-6">المصادقة الثنائية</h1>
        <p className="text-gray-400 mb-4">أدخل رمز التحقق من تطبيق المصادقة</p>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="رمز التحقق"
          className="w-full p-3 rounded-lg bg-dark-50 border border-gray-700 text-white mb-4"
          required
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 rounded-lg bg-violet-600 text-white font-bold disabled:opacity-50"
        >
          {loading ? 'جاري التحقق...' : 'تحقق'}
        </button>
      </form>
    </div>
  );
}