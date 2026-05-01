'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/components/ThemeProvider';
import {
  Home, Wallet, PlusCircle, FileText, Package, Shield,
  Code, TrendingUp, Menu, X, User, CreditCard, LogOut, Download,
} from 'lucide-react';
import { useWalletModals } from './WalletModalProvider';

interface UserData {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  balance?: number;
  total_spent?: number;
  wallet_id?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  action?: string;
  badge?: string;
  disabled?: boolean;
}

const DEFAULT_USER: UserData = {
  id: '', email: '', role: 'customer', full_name: 'مستخدم',
  balance: -144.665, total_spent: 0.552, wallet_id: '3249#',
};

const mainNavItems: NavItem[] = [
  { id: 'nav-home', label: 'الرئيسية', icon: Home, href: '/customer-dashboard' },
  { id: 'nav-add-balance', label: 'اضافة رصيد', icon: PlusCircle, action: 'deposit' },
  { id: 'nav-payments', label: 'دفعات', icon: FileText, href: '/customer-dashboard/transactions' },
  { id: 'nav-wallet', label: 'محفظتي', icon: Wallet, href: '/customer-dashboard/wallet' },
  { id: 'nav-orders', label: 'طلباتي', icon: Package, href: '/customer-dashboard/orders' },
  { id: 'nav-security', label: 'الحماية', icon: Shield, href: '/customer-dashboard/security' },
];

const bottomItems: NavItem[] = [
  { id: 'nav-api', label: 'API', icon: Code, disabled: true, badge: 'قريباً' },
  { id: 'nav-rpi', label: 'RPI', icon: TrendingUp, disabled: true, badge: 'قريباً' },
];

export default function DashboardSidebar({ userData }: { userData?: UserData | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [footerCopyright, setFooterCopyright] = useState('© 2025 Sahl Cash');
  const pathname = usePathname();
  const router = useRouter();
  const { openDeposit } = useWalletModals();
  const { canInstallPwa, installPwa } = useApp();

  const user: UserData = { ...DEFAULT_USER, ...(userData || {}) };
  const displayName = user.full_name || user.email?.split('@')[0] || 'مستخدم';
  const userInitial = displayName.charAt(0);
  const isBalanceNegative = (user.balance || 0) < 0;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
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

  const handleAction = useCallback((action: string) => {
    if (action === 'deposit') openDeposit();
  }, [openDeposit]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/sign-up-login-screen');
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ background: '#070410', direction: 'rtl' }}>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* بطاقة المستخدم */}
        <div className="px-4 pt-6 pb-4">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(12, 113, 178, 0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(12, 113, 178, 0.2)' }}>
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #0c71b2, #00D4FF)', color: 'white' }}>{userInitial}</div>
            </div>
            <div className="text-center mb-3">
              <p className="text-white font-bold text-base">{displayName}</p>
              <p className="text-gray-400 text-xs mt-0.5">{user.wallet_id}</p>
            </div>
            <div className="text-center mb-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(12, 113, 178, 0.15)', color: '#0c71b2' }}>محدد الحرف • USD</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">الرصيد الحالي</span>
              <span className="text-sm font-bold" style={{ color: isBalanceNegative ? '#ef4444' : '#22c55e' }}>$ {user.balance?.toFixed(3)}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-400">إجمالي</span>
              <span className="text-sm font-bold text-green-400">{user.total_spent?.toFixed(3)}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400"><CreditCard size={14} /><span>عبر مدفوع</span></div>
          </div>
        </div>

        <div className="border-t mx-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* قائمة التنقل */}
        <nav className="py-2 px-3">
          <ul className="space-y-0.5">
            {mainNavItems.map(item => {
              const Icon = item.icon;
              const active = item.href ? isActive(item.href) : false;
              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                      style={active ? { background: 'rgba(12, 113, 178, 0.15)', borderRight: '3px solid #0c71b2' } : { borderRight: '3px solid transparent' }}>
                      <Icon size={18} style={{ color: active ? '#0c71b2' : undefined }} />
                      <span className="text-sm font-medium flex-1 text-right">{item.label}</span>
                    </Link>
                  ) : (
                    <button onClick={() => handleAction(item.action!)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white">
                      <Icon size={18} /><span className="text-sm font-medium flex-1 text-right">{item.label}</span>
                    </button>
                  )}
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
                  <Link href={item.disabled ? '#' : item.href!} onClick={e => item.disabled && e.preventDefault()}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${item.disabled ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}>
                    <Icon size={18} />
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
        <button onClick={() => setLogoutModal(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10">
          <LogOut size={18} /><span className="text-sm">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {isMobile && (
        <button onClick={() => setMobileOpen(true)} className="fixed top-4 right-4 z-40 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(12, 113, 178, 0.15)', border: '1px solid rgba(12, 113, 178, 0.3)', color: '#0c71b2' }}>
          <Menu size={20} />
        </button>
      )}
      {!isMobile && (
        <aside className="h-screen sticky top-0 flex-shrink-0" style={{ width: '280px', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          {sidebarContent}
        </aside>
      )}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-[280px] shadow-2xl" style={{ background: '#070410' }}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 left-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400" style={{ background: 'rgba(255,255,255,0.05)' }}><X size={16} /></button>
            {sidebarContent}
          </div>
        </div>
      )}
      {logoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl p-6 w-80 text-center border bg-[#111128] border-gray-700">
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