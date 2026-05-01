'use client';
import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft, Mail, Sparkles } from 'lucide-react';
import ThemeProvider from '@/components/ThemeProvider';

function ConfirmedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get('next') || '/customer-dashboard';
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [redirectPath, setRedirectPath] = useState(next);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsLoggedIn(true);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role;
        if (role === 'agent') setRedirectPath('/agent-dashboard');
        else if (role === 'super_admin' || role === 'staff') setRedirectPath('/dashboard');
        else setRedirectPath('/customer-dashboard');
      } catch {}

      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push(redirectPath);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [next, router, redirectPath]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: '#0A0A14' }} dir="rtl">
      {/* تأثيرات خلفية */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(108,58,255,0.8), transparent)', filter: 'blur(60px)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.8), transparent)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="rounded-3xl p-8 md:p-10 text-center"
          style={{
            background: 'rgba(17,17,40,0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(108,58,255,0.25)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(108,58,255,0.1)',
          }}>
          {/* أيقونة متحركة */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full opacity-20"
                style={{ background: 'rgba(0,255,148,0.3)' }} />
              <div className="w-24 h-24 rounded-full flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(108,58,255,0.2), rgba(0,212,255,0.1))',
                  border: '2px solid rgba(0,255,148,0.5)',
                }}>
                <Mail size={44} style={{ color: '#00FF94' }} />
              </div>
            </div>
          </div>

          {/* رسالة TOP UP */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4"
            style={{ background: 'rgba(108,58,255,0.15)', border: '1px solid rgba(108,58,255,0.35)', color: '#B899FF' }}>
            <Sparkles size={14} className="text-cyan-400" />
            <span>TOP UP</span>
          </div>

          <h1 className="text-3xl font-black mb-3"
            style={{
              background: 'linear-gradient(135deg, #6C3AFF, #00D4FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            {isLoggedIn ? 'الحساب جاهز!' : 'تم تأكيد البريد!'}
          </h1>

          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            {isLoggedIn
              ? 'رائع! حسابك مفعل. سيتم توجيهك إلى لوحة التحكم خلال لحظات...'
              : 'تم تأكيد بريدك الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول والبدء في استخدام خدمات ModC.'}
          </p>

          {isLoggedIn && (
            <div className="flex items-center justify-center gap-2 mb-6 text-gray-400">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #6C3AFF, #00D4FF)', color: 'white' }}>
                {countdown}
              </div>
              <span>ثوانٍ للتوجيه التلقائي</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {isLoggedIn ? (
              <Link href={redirectPath}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #6C3AFF, #00D4FF)',
                  boxShadow: '0 6px 20px rgba(108,58,255,0.3)',
                }}>
                <ArrowLeft size={18} />
                <span>الذهاب إلى لوحة التحكم</span>
              </Link>
            ) : (
              <Link href="/sign-up-login-screen"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #6C3AFF, #00D4FF)',
                  boxShadow: '0 6px 20px rgba(108,58,255,0.3)',
                }}>
                <ArrowLeft size={18} />
                <span>تسجيل الدخول</span>
              </Link>
            )}
            <Link href="/homepage" className="text-sm text-gray-400 hover:text-violet-300 transition-colors">
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A14' }}>
      <div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
}

export default function ConfirmedPage() {
  return (
    <ThemeProvider>
      <Suspense fallback={<LoadingFallback />}>
        <ConfirmedContent />
      </Suspense>
    </ThemeProvider>
  );
}