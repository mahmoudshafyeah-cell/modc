'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import GlobalControls from '@/components/GlobalControls';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { supabase } from '@/lib/supabase';
import { FcGoogle } from 'react-icons/fc';
import { FaTelegramPlane } from 'react-icons/fa';
import { toast } from 'sonner';

// تعريف نوع بيانات مستخدم تيليجرام
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export default function AuthPanel() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  // const [googleLoading, setGoogleLoading] = useState(false); // 🚧 معطل مؤقتاً
  // const [telegramLoading, setTelegramLoading] = useState(false); // 🚧 معطل مؤقتاً
  const telegramRef = useRef<HTMLDivElement>(null);

  // إنشاء زر تيليجرام ديناميكياً - 🚧 معطل مؤقتاً
  /*
  useEffect(() => {
    if (typeof window === 'undefined' || !telegramRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'ModCStoreBot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'true');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.async = true;

    telegramRef.current.appendChild(script);

    (window as any).onTelegramAuth = (user: TelegramUser) => {
      handleTelegramLogin(user);
    };

    return () => {
      if (telegramRef.current) telegramRef.current.innerHTML = '';
    };
  }, []);
  */

  /*
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) toast.error(error.message);
    } catch (err) {
      toast.error('حدث خطأ أثناء الاتصال بـ Google');
    } finally {
      setGoogleLoading(false);
    }
  };
  */

  /*
  const handleTelegramLogin = async (user: TelegramUser) => {
    setTelegramLoading(true);
    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تسجيل الدخول');

      localStorage.setItem('auth_token', data.token);
      toast.success('تم تسجيل الدخول بنجاح');
      window.location.href = data.redirectPath || '/customer-dashboard';
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setTelegramLoading(false);
    }
  };
  */

  return (
    <div className="flex flex-col h-full" style={{ background: '#0A0A14' }}>
      <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(108,58,255,0.15)' }}>
        <GlobalControls compact />
        <Link href="/homepage" className="flex items-center gap-2 lg:hidden">
          <AppLogo size={32} />
        </Link>
        <Link href="/homepage" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
          ← العودة للرئيسية
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="text-right mb-8">
          <h1 className="text-3xl font-black text-white mb-2">
            {tab === 'login' ? 'مرحباً بعودتك 👋' : 'أنشئ حسابك 🚀'}
          </h1>
          <p className="text-gray-400">
            {tab === 'login' ? 'سجل دخولك للوصول إلى محفظتك ومنتجاتك' : 'انضم إلى +50,000 مستخدم على ModC'}
          </p>
        </div>

        <div className="flex gap-1 p-1 rounded-2xl mb-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(108,58,255,0.15)' }}>
          {[
            { key: 'login', label: 'تسجيل الدخول' },
            { key: 'register', label: 'إنشاء حساب' },
          ].map(t => (
            <button
              key={`auth-tab-${t.key}`}
              onClick={() => setTab(t.key as any)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${tab === t.key ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              style={tab === t.key ? { background: 'linear-gradient(135deg, #6C3AFF, #9B6BFF)', boxShadow: '0 4px 20px rgba(108,58,255,0.4)' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'login' ? <LoginForm onSwitch={() => setTab('register')} /> : <RegisterForm onSwitch={() => setTab('login')} />}

        {/* فاصل "أو" */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 text-gray-400" style={{ background: '#0A0A14' }}>أو</span>
          </div>
        </div>

        {/* 🚧 زر Google - قريباً */}
        <button
          disabled
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-700 text-gray-500 font-medium mb-3 opacity-60 cursor-not-allowed"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <FcGoogle size={22} className="opacity-50" />
          <span>تسجيل الدخول عبر Google (قريباً)</span>
        </button>

        {/* 🚧 زر تيليجرام - قريباً */}
        <button
          disabled
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-700 text-gray-500 font-medium mb-3 opacity-60 cursor-not-allowed"
          style={{ background: 'rgba(0,136,204,0.05)' }}
        >
          <FaTelegramPlane size={22} className="text-blue-400 opacity-50" />
          <span>تسجيل الدخول عبر تيليجرام (قريباً)</span>
        </button>

        {/* حاوية زر تيليجرام الرسمي (مخفية) */}
        <div ref={telegramRef} className="flex justify-center opacity-0 h-0 overflow-hidden"></div>
      </div>
    </div>
  );
}