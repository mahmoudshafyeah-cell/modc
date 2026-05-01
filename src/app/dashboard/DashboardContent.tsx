// src/app/dashboard/DashboardContent.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import jwt from 'jsonwebtoken';
import AdminStats from './AdminStats';
import AdminUsersTable from './AdminUsersTable';
import AdminDepositsPanel from './AdminDepositsPanel';
import ActivityLogs from './ActivityLogs';
import StaffManagement from './StaffManagement';
import NotificationsList from './notifications/NotificationsList';
import SettingsContent from './settings/SettingsContent';
import StockManagement from './StockManagement';
import ReportsPage from './reports/page';
import VipLevelsManager from './VipLevelsManager';
import CreditManager from './CreditManager';
import KycManager from './KycManager';
import CommissionManager from './CommissionManager';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  UserPlus,
  Bell,
  Package,
  BarChart3,
  Activity,
  Crown,
  Shield,
  Percent,
} from 'lucide-react';

type AdminTab =
  | 'overview'
  | 'users'
  | 'deposits'
  | 'staff'
  | 'notifications'
  | 'settings'
  | 'stock'
  | 'reports'
  | 'activity'
  | 'vip'
  | 'credit'
  | 'kyc'
  | 'commissions';

const tabs = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard, color: '#00FF94' },
  { id: 'activity', label: 'سجل النشاطات', icon: Activity, color: '#9B6BFF' },
  { id: 'users', label: 'المستخدمون', icon: Users, color: '#6C3AFF' },
  { id: 'deposits', label: 'العمليات المالية', icon: CreditCard, color: '#FFB800' },
  { id: 'staff', label: 'الموظفون', icon: UserPlus, color: '#00D4FF' },
  { id: 'vip', label: 'مستويات VIP', icon: Crown, color: '#FFB800' },
  { id: 'credit', label: 'الائتمان', icon: CreditCard, color: '#FF4466' },
  { id: 'kyc', label: 'طلبات KYC', icon: Shield, color: '#00FF94' },
  { id: 'commissions', label: 'عمولات الوكلاء', icon: Percent, color: '#00FF94' },
  { id: 'stock', label: 'المخزون', icon: Package, color: '#9B6BFF' },
  { id: 'reports', label: 'التقارير', icon: BarChart3, color: '#00D4FF' },
  { id: 'notifications', label: 'الإشعارات', icon: Bell, color: '#FFB800' },
  { id: 'settings', label: 'الإعدادات', icon: Settings, color: '#FF4466' },
];

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as AdminTab | null;
  const [activeTab, setActiveTab] = useState<AdminTab>(tabParam || 'overview');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tabParam && tabs.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded = jwt.decode(token) as { role: string; email: string };
        setUserRole(decoded?.role || 'customer');
        const emailName = decoded.email.split('@')[0];
        setUserName(emailName);
        setIsSuperAdmin(decoded?.role === 'super_admin');
      } catch (error) {
        console.error('فشل فك تشفير التوكن', error);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const dashboardTitle =
    userRole === 'super_admin' ? 'لوحة تحكم المدير 🛡️' : 'لوحة تحكم الموظف';

  return (
    <div className="p-4 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{
            background: 'rgba(0,255,148,0.1)',
            border: '1px solid rgba(0,255,148,0.2)',
            color: '#00FF94',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>النظام يعمل بشكل طبيعي</span>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-black text-white">{dashboardTitle}</h1>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString('ar-SY', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          if (tab.id === 'staff' && !isSuperAdmin) return null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
              style={{
                background: isActive ? `${tab.color}18` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? `${tab.color}35` : 'rgba(255,255,255,0.08)'}`,
                color: isActive ? tab.color : '#6B7280',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && <AdminStats />}
      {activeTab === 'users' && <AdminUsersTable />}
      {activeTab === 'deposits' && <AdminDepositsPanel />}
      {activeTab === 'staff' && <StaffManagement />}
      {activeTab === 'vip' && <VipLevelsManager />}
      {activeTab === 'credit' && <CreditManager />}
      {activeTab === 'kyc' && <KycManager />}
      {activeTab === 'commissions' && <CommissionManager />}
      {activeTab === 'stock' && <StockManagement />}
      {activeTab === 'reports' && <ReportsPage />}
      {activeTab === 'activity' && <ActivityLogs />}
      {activeTab === 'notifications' && <NotificationsList />}
      {activeTab === 'settings' && <SettingsContent />}
    </div>
  );
}