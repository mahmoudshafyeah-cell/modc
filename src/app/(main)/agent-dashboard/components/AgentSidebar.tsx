// المسار: src/app/(main)/agent-dashboard/components/AgentSidebar.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Users, PlusCircle, FileText, Wallet, Package, Shield, Code,
  UserPlus, Info, FileCheck, Lock, Menu, X, CreditCard,
  LogOut, Crown,
} from 'lucide-react';

interface UserData {
  id: string; email: string; role: string; full_name?: string;
  balance?: number; total_earned?: number; agent_code?: string;
  avatar_url?: string | null;
}

interface NavItem {
  id: string; label: string; icon: React.ElementType;
  tab?: string;
  action?: string;
  badge?: string;
  disabled?: boolean;
}

// قائمة الوكيل الأساسية
const baseNavItems: NavItem[] = [
  { id: 'agent-home', label: 'الرئيسية', icon: Home, tab: 'home' },
  { id: 'agent-clients', label: 'عملائي', icon: Users, tab: 'clients' },
  { id: 'agent-deposit', label: 'اضافة رصيد', icon: PlusCircle, action: 'deposit' },
  { id: 'agent-payments', label: 'دفعاتي', icon: FileText, tab: 'payments' },
  { id: 'agent-wallet', label: 'محفظتي', icon: Wallet, tab: 'wallet' },
  { id: 'agent-orders', label: 'طلباتي', icon: Package, tab: 'orders' },
  { id: 'agent-security', label: 'الحماية', icon: Shield, tab: 'security' },
  { id: 'agent-vip', label: 'مستواي', icon: Crown, tab: 'vip' },
  { id: 'agent-api', label: 'API', icon: Code, disabled: true, badge: 'قريباً' },
  { id: 'agent-credit', label: 'المديونية', icon: CreditCard, tab: 'credit' },
];

// العنصر الإضافي للوكيل الأساسي فقط
const inviteItem: NavItem = { id: 'agent-invite', label: 'دعوة وكيل فرعي', icon: UserPlus, tab: 'invite' };

const bottomNavItems: NavItem[] = [
  { id: 'agent-about', label: 'من نحن', icon: Info, tab: 'about' },
  { id: 'agent-terms', label: 'شروط الاستخدام', icon: FileCheck, tab: 'terms' },
  { id: 'agent-privacy', label: 'سياسة الخصوصية', icon: Lock, tab: 'privacy' },
];

export default function AgentSidebar({
  userData, activeTab, setActiveTab, onDeposit, isSubAgent,
}: {
  userData?: UserData | null;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onDeposit?: () => void;
  isSubAgent?: boolean; // ✅ خاصية الوكيل الفرعي
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // دمج العناصر مع إخفاء "دعوة وكيل فرعي" إذا كان وكيلاً فرعياً
  const agentNavItems = isSubAgent ? baseNavItems : [...baseNavItems, inviteItem];

  const displayName = userData?.full_name || userData?.email?.split('@')[0] || 'وكيل';
  const userInitial = displayName.charAt(0);
  const isBalanceNegative = (userData?.balance || 0) < 0;
  const hasAvatar = !!userData?.avatar_url;

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

  const handleAction = useCallback((action: string) => {
    if (action === 'deposit' && onDeposit) onDeposit();
  }, [onDeposit]);

  const handleLogout = () => { localStorage.removeItem('auth_token'); router.push('/sign-up-login-screen'); };

  const handleNavClick = (item: NavItem) => {
    if (item.disabled) return;
    if (item.action) handleAction(item.action);
    else if (item.tab && setActiveTab) setActiveTab(item.tab);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ background: '#070410', direction: 'rtl' }}>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* بطاقة المستخدم */}
        <div className="px-4 pt-6 pb-4">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(12, 113, 178, 0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(12, 113, 178, 0.2)' }}>
            <div className="flex justify-center mb-3">
              {hasAvatar ? (
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-cyan-500/50"><img src={userData?.avatar_url!} alt="الصورة" className="w-full h-full object-cover" /></div>
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ring-2" style={{ background: 'linear-gradient(135deg, #0c71b2, #00D4FF)', color: 'white' }}>{userInitial}</div>
              )}
            </div>
            <div className="text-center mb-3">
              <p className="text-white font-bold text-base">{displayName}</p>
              <p className="text-gray-400 text-xs mt-0.5">{userData?.agent_code || 'وكيل'}</p>
            </div>
            <div className="text-center mb-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(12, 113, 178, 0.15)', color: '#0c71b2' }}>
                {isSubAgent ? 'وكيل فرعي' : 'وكيل معتمد'}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">الرصيد الحالي</span>
              <span className="text-sm font-bold" style={{ color: isBalanceNegative ? '#ef4444' : '#22c55e' }}>$ {userData?.balance?.toFixed(3) || '0.000'}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-400">إجمالي الأرباح</span>
              <span className="text-sm font-bold text-green-400">{userData?.total_earned?.toFixed(3) || '0.000'}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <CreditCard size={14} />
              <span>{isSubAgent ? 'محفظة وكيل فرعي' : 'محفظة وكيل'}</span>
            </div>
          </div>
        </div>

        <div className="border-t mx-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* قائمة التنقل */}
        <nav className="py-2 px-3">
          <ul className="space-y-0.5">
            {agentNavItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.tab;
              const disabled = item.disabled;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item)}
                    disabled={disabled}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${active ? 'text-white' : disabled ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
                    style={active ? { background: 'rgba(12, 113, 178, 0.15)', borderRight: '3px solid #0c71b2' } : { borderRight: '3px solid transparent' }}
                  >
                    <Icon size={18} style={{ color: active ? '#0c71b2' : undefined, flexShrink: 0 }} />
                    <span className="text-sm font-medium flex-1 text-right">{item.label}</span>
                    {disabled && item.badge && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-500">{item.badge}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t mx-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* روابط ثانوية */}
        <div className="px-3 py-2">
          <ul className="space-y-0.5">
            {bottomNavItems.map(item => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    href={item.tab === 'about' ? '/legal/about' : item.tab === 'terms' ? '/legal/terms-of-service' : '/legal/privacy-policy'}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-gray-400 hover:text-white"
                  >
                    <Icon size={18} style={{ flexShrink: 0 }} />
                    <span className="text-sm font-medium flex-1 text-right">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="flex-shrink-0 px-4 py-3 text-center"><p className="text-xs text-gray-600">© 2026 ModC - {isSubAgent ? 'وكيل فرعي' : 'وكيل'}</p></div>
      <div className="flex-shrink-0 px-3 pb-4">
        <button onClick={() => setLogoutModal(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"><LogOut size={18} /><span className="text-sm">تسجيل الخروج</span></button>
      </div>
    </div>
  );

  return (
    <>
      {isMobile && (
        <button onClick={() => setMobileOpen(true)} className="fixed top-4 right-4 z-40 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(12, 113, 178, 0.15)', border: '1px solid rgba(12, 113, 178, 0.3)', color: '#0c71b2' }}><Menu size={20} /></button>
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