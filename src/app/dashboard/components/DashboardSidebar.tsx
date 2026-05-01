'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/components/ThemeProvider';
import {
  LayoutDashboard, Users, CreditCard, UserPlus, Package,
  BarChart3, Activity, Bell, Settings, Home, Menu, X, User,
  LogOut, Crown, Shield, Percent, Download,
} from 'lucide-react';

interface AdminUserData {
  id: string; email: string; role: string; full_name?: string; admin_code?: string;
}

const adminNavItems = [
  { id: 'nav-overview', label: 'نظرة عامة', icon: LayoutDashboard, href: '/dashboard', tab: 'overview', color: '#00FF94' },
  { id: 'nav-activity', label: 'سجل النشاطات', icon: Activity, href: '/dashboard?tab=activity', tab: 'activity', color: '#9B6BFF' },
  { id: 'nav-users', label: 'المستخدمون', icon: Users, href: '/dashboard?tab=users', tab: 'users', color: '#6C3AFF' },
  { id: 'nav-finance', label: 'العمليات المالية', icon: CreditCard, href: '/dashboard?tab=deposits', tab: 'deposits', color: '#FFB800' },
  { id: 'nav-staff', label: 'الموظفون', icon: UserPlus, href: '/dashboard?tab=staff', tab: 'staff', color: '#00D4FF' },
  { id: 'nav-vip', label: 'مستويات VIP', icon: Crown, href: '/dashboard?tab=vip', tab: 'vip', color: '#FFB800' },
  { id: 'nav-credit', label: 'الائتمان', icon: CreditCard, href: '/dashboard?tab=credit', tab: 'credit', color: '#FF4466' },
  { id: 'nav-kyc', label: 'طلبات KYC', icon: Shield, href: '/dashboard?tab=kyc', tab: 'kyc', color: '#00FF94' },
  { id: 'nav-commissions', label: 'عمولات الوكلاء', icon: Percent, href: '/dashboard?tab=commissions', tab: 'commissions', color: '#00FF94' },
  { id: 'nav-stock', label: 'المخزون', icon: Package, href: '/dashboard?tab=stock', tab: 'stock', color: '#9B6BFF' },
  { id: 'nav-reports', label: 'التقارير', icon: BarChart3, href: '/dashboard?tab=reports', tab: 'reports', color: '#00D4FF' },
  { id: 'nav-notifications', label: 'الإشعارات', icon: Bell, href: '/dashboard?tab=notifications', tab: 'notifications', color: '#FFB800' },
  { id: 'nav-settings', label: 'الإعدادات', icon: Settings, href: '/dashboard?tab=settings', tab: 'settings', color: '#FF4466' },
];

const quickLinks = [
  { id: 'nav-products-page', label: 'صفحة المنتجات', icon: Package, href: '/products', external: true },
  { id: 'nav-homepage', label: 'الصفحة الرئيسية', icon: Home, href: '/homepage', external: true },
];

const bottomItems = [
  { id: 'nav-agent-dashboard', label: 'لوحة الوكيل', icon: User, href: '/agent-dashboard', badge: 'وكيل' },
];

export default function DashboardSidebar({ userData }: { userData?: AdminUserData | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [footerCopyright, setFooterCopyright] = useState('© 2025 ModC - الإدارة');
  const pathname = usePathname();
  const router = useRouter();
  const { canInstallPwa, installPwa } = useApp();

  const displayName = userData?.full_name || userData?.email?.split('@')[0] || 'مدير';
  const userInitial = displayName.charAt(0);
  const adminCode = userData?.admin_code || `ADM-${(userData?.id || '000000').slice(0, 6).toUpperCase()}`;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    if (mobileOpen) { document.addEventListener('keydown', handleEscape); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', handleEscape); document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    async function fetchFooterSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (res.ok && data.settings?.footer_copyright) setFooterCopyright(data.settings.footer_copyright);
      } catch {}
    }
    fetchFooterSettings();
  }, []);

  const handleLogout = () => { localStorage.removeItem('auth_token'); router.push('/sign-up-login-screen'); };

  const isActive = (href?: string, tab?: string) => {
    if (!href) return false;
    if (tab) {
      const currentTab = new URLSearchParams(window.location.search).get('tab');
      if (href === '/dashboard') return pathname === '/dashboard' && !currentTab;
      return currentTab === tab;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ background: '#070410', direction: 'rtl' }}>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* بطاقة المدير */}
        <div className="px-4 pt-6 pb-4">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255, 184, 0, 0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 184, 0, 0.2)' }}>
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ring-2" style={{ background: 'linear-gradient(135deg, #FFB800, #FF6B00)', color: 'white' }}>{userInitial}</div>
            </div>
            <div className="text-center mb-3">
              <p className="text-white font-bold text-base">{displayName}</p>
              <p className="text-xs mt-0.5" style={{ color: '#FFB800' }}>{adminCode}</p>
            </div>
            <div className="text-center">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(255, 184, 0, 0.15)', color: '#FFB800', border: '1px solid rgba(255, 184, 0, 0.25)' }}>🛡️ مدير النظام</span>
            </div>
          </div>
        </div>

        <div className="border-t mx-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* قائمة التنقل */}
        <nav className="py-2 px-3">
          <p className="px-3 mb-2 text-xs font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>القائمة الرئيسية</p>
          <ul className="space-y-0.5">
            {adminNavItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href, item.tab);
              return (
                <li key={item.id}>
                  <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${active ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    style={active ? { background: `${item.color}18`, borderRight: `3px solid ${item.color}` } : { borderRight: '3px solid transparent' }}>
                    <Icon size={18} style={{ color: active ? item.color : undefined, flexShrink: 0 }} />
                    <span className="text-sm font-medium flex-1 text-right">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="px-3 mt-4 mb-2 text-xs font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>روابط سريعة</p>
          <ul className="space-y-0.5">
            {quickLinks.map(item => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link href={item.href} target={item.external ? '_blank' : undefined} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-gray-400 hover:text-white">
                    <Icon size={18} style={{ flexShrink: 0 }} />
                    <span className="text-sm font-medium flex-1 text-right">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t mx-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* روابط ثانوية */}
        <div className="px-3 py-2">
          <ul className="space-y-0.5">
            {bottomItems.map(item => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-gray-400 hover:text-white">
                    <Icon size={18} style={{ flexShrink: 0 }} />
                    <span className="text-sm font-medium flex-1 text-right">{item.label}</span>
                    {item.badge && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-500">{item.badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* زر تثبيت التطبيق */}
        {canInstallPwa && (
          <div className="px-3 py-2 border-t mx-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <button onClick={installPwa} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-violet-500/8 transition-all">
              <Download size={18} />
              <span className="text-sm">تثبيت التطبيق</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 px-4 py-3 text-center"><p className="text-xs text-gray-600">{footerCopyright}</p></div>
      <div className="flex-shrink-0 px-3 pb-4">
        <button onClick={() => setLogoutModal(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"><LogOut size={18} /><span className="text-sm">تسجيل الخروج</span></button>
      </div>
    </div>
  );

  return (
    <>
      {isMobile && (
        <button onClick={() => setMobileOpen(true)} className="fixed top-4 right-4 z-40 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255, 184, 0, 0.15)', border: '1px solid rgba(255, 184, 0, 0.3)', color: '#FFB800' }}><Menu size={20} /></button>
      )}
      {!isMobile && (
        <aside className="h-screen sticky top-0 flex-shrink-0" style={{ width: '280px', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>{sidebarContent}</aside>
      )}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-[280px] shadow-2xl" style={{ background: '#070410' }}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 left-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9aa0b0' }}><X size={16} /></button>
            {sidebarContent}
          </div>
        </div>
      )}
      {logoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl p-6 w-80 text-center border" style={{ background: '#111128', borderColor: 'rgba(255,255,255,0.1)' }}>
            <h3 className="text-lg font-bold text-white mb-4">تسجيل الخروج</h3>
            <p className="text-gray-400 mb-6">هل أنت متأكد أنك تريد تسجيل الخروج؟</p>
            <div className="flex gap-3">
              <button onClick={() => { handleLogout(); setLogoutModal(false); }} className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold">نعم</button>
              <button onClick={() => setLogoutModal(false)} className="flex-1 py-2 rounded-xl bg-gray-700 text-white font-bold">لا</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}