// src/components/dashboard/DashboardSidebar.tsx
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import {
  LayoutDashboard, Users, CreditCard, UserPlus, Bell, Settings, LogOut,
  ChevronLeft, Package, BarChart3, Activity,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  role: string;
  full_name?: string;
}

const navItems = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard, href: '/dashboard?tab=overview', color: '#00FF94' },
  { id: 'activity', label: 'سجل النشاطات', icon: Activity, href: '/dashboard?tab=activity', color: '#9B6BFF' },
  { id: 'users', label: 'المستخدمون', icon: Users, href: '/dashboard?tab=users', color: '#6C3AFF' },
  { id: 'deposits', label: 'العمليات المالية', icon: CreditCard, href: '/dashboard?tab=deposits', color: '#FFB800' },
  { id: 'staff', label: 'الموظفون', icon: UserPlus, href: '/dashboard?tab=staff', color: '#00D4FF' },
  { id: 'stock', label: 'المخزون', icon: Package, href: '/dashboard?tab=stock', color: '#9B6BFF' },
  { id: 'reports', label: 'التقارير', icon: BarChart3, href: '/dashboard?tab=reports', color: '#00D4FF' },
  { id: 'notifications', label: 'الإشعارات', icon: Bell, href: '/dashboard?tab=notifications', color: '#FFB800' },
  { id: 'settings', label: 'الإعدادات', icon: Settings, href: '/dashboard?tab=settings', color: '#FF4466' },
];

interface AdminSidebarProps {
  userData?: UserData | null;
}

export default function AdminDashboardSidebar({ userData }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/sign-up-login-screen');
  };

  const displayName = userData?.full_name || userData?.email?.split('@')[0] || 'مدير';
  const userInitial = displayName.charAt(0);

  return (
    <>
      <aside className={`flex flex-col h-screen sticky top-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} flex-shrink-0`}
        style={{ background: '#0D0D22', borderLeft: '1px solid rgba(108,58,255,0.15)' }}>
        <div className={`flex items-center h-16 px-4 border-b transition-all ${collapsed ? 'justify-center' : 'justify-between'}`}
          style={{ borderColor: 'rgba(108,58,255,0.15)' }}>
          {!collapsed && <div className="flex items-center gap-2"><AppLogo size={28} /><span className="font-bold text-lg text-gradient-violet">ModC</span></div>}
          {collapsed && <AppLogo size={28} />}
          <button onClick={() => setCollapsed(c => !c)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-violet-500/20" style={{ color: '#6C3AFF' }}>
            <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname.includes(item.id);
            return (
              <Link key={item.id} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full ${collapsed ? 'justify-center' : ''} ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-violet-500/8'}`}
                style={isActive ? { background: `${item.color}18`, border: `1px solid ${item.color}30` } : {}}>
                <Icon size={18} style={{ color: isActive ? item.color : undefined }} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t space-y-1" style={{ borderColor: 'rgba(108,58,255,0.15)' }}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl" style={{ background: 'rgba(108,58,255,0.1)', border: '1px solid rgba(108,58,255,0.2)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #6C3AFF, #00D4FF)', color: 'white' }}>{userInitial}</div>
              <div className="flex-1 min-w-0"><p className="text-xs font-bold text-white truncate">{displayName}</p><p className="text-xs text-gray-500 truncate">{userData?.email || ''}</p></div>
            </div>
          )}
          <button onClick={() => setLogoutModal(true)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all w-full ${collapsed ? 'justify-center' : ''}`}>
            <LogOut size={18} />{!collapsed && <span className="text-sm">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {logoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-dark-100 rounded-2xl p-6 w-80 text-center border border-gray-700">
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