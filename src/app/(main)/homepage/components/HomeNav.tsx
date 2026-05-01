'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import GlobalControls from '@/components/GlobalControls';
import { Menu, X, Headphones } from 'lucide-react';

export default function HomeNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('963933068923');

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (res.ok && data.settings?.whatsapp_number) {
          setWhatsappNumber(data.settings.whatsapp_number);
        }
      } catch {}
    }
    fetchSettings();
  }, []);

  const navLinks = [
    { label: 'الرئيسية', href: '/homepage' },
    { label: 'منتجاتنا', href: '/products' },
    { label: 'عن منصة MODC', href: '/legal/about' },
  ];

  const handleWhatsApp = () => {
    const message = encodeURIComponent('مرحباً، أحتاج إلى مساعدة في منصة ModC');
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'py-3' : 'py-5'
        }`}
        style={{
          background: scrolled ? 'rgba(10,10,20,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(108,58,255,0.15)' : 'none',
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 flex items-center justify-between">
          <Link href="/homepage" className="flex items-center gap-3 group">
            <AppLogo size={36} />
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={`nav-${link.href}`}
                href={link.href}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-violet-500/10 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
            {/* زر الدعم الفني - واتساب */}
            <button
              onClick={handleWhatsApp}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-green-500/10 transition-all duration-200 flex items-center gap-1.5"
            >
              <Headphones size={14} />
              <span>الدعم الفني</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <GlobalControls />
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/sign-up-login-screen"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-violet-300 border border-violet-500/30 hover:bg-violet-500/10 transition-all duration-200"
              >
                تسجيل الدخول
              </Link>
              <Link href="/sign-up-login-screen" className="btn-primary text-sm px-5 py-2.5">
                إنشاء حساب
              </Link>
            </div>
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl"
              style={{
                background: 'rgba(108,58,255,0.15)',
                border: '1px solid rgba(108,58,255,0.3)',
              }}
            >
              {mobileOpen ? (
                <X size={18} className="text-violet-300" />
              ) : (
                <Menu size={18} className="text-violet-300" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden animate-fade-in" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          />
          <div
            className="absolute top-0 right-0 bottom-0 w-80 animate-slide-up"
            style={{ background: '#0D0D22', borderLeft: '1px solid rgba(108,58,255,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b" style={{ borderColor: 'rgba(108,58,255,0.15)' }}>
              <div className="flex items-center gap-3">
                <AppLogo size={32} />
              </div>
            </div>
            <div className="p-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={`mobile-nav-${link.href}`}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-violet-500/10 transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { handleWhatsApp(); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-green-500/10 transition-all"
              >
                <Headphones size={16} />
                <span>الدعم الفني (واتساب)</span>
              </button>
              <hr className="my-2" style={{ borderColor: 'rgba(108,58,255,0.15)' }} />
              <Link
                href="/legal/privacy-policy"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-violet-500/10 transition-all text-sm"
              >
                سياسة الخصوصية
              </Link>
              <Link
                href="/legal/terms-of-service"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-violet-500/10 transition-all text-sm"
              >
                شروط الاستخدام
              </Link>
              <Link
                href="/legal/faq"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-violet-500/10 transition-all text-sm"
              >
                الأسئلة الشائعة
              </Link>
            </div>
            <div className="p-4 space-y-3 border-t" style={{ borderColor: 'rgba(108,58,255,0.15)' }}>
              <Link
                href="/sign-up-login-screen"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center py-3 rounded-xl text-sm font-semibold border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition-all"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/sign-up-login-screen"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center btn-primary text-sm"
              >
                إنشاء حساب مجاني
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}