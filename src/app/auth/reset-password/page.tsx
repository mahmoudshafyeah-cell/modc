'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://modc.store/auth/update-password',
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" dir="rtl">
      <form onSubmit={handleReset} className="w-full max-w-md p-8 rounded-2xl bg-dark-50 border border-violet-500/20">
        <h1 className="text-2xl font-bold text-white mb-6">نسيت كلمة المرور</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="بريدك الإلكتروني"
          required
          className="w-full p-3 rounded-lg bg-dark-100 border border-gray-700 text-white mb-4"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
        >
          {loading ? 'جاري الإرسال...' : 'إرسال رابط التعيين'}
        </button>
      </form>
    </div>
  );
}