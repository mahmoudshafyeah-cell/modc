// src/app/dashboard/layout.tsx
'use client';
import { ReactNode } from 'react';
import DashboardSidebar from './components/DashboardSidebar';
import { WalletModalProvider } from './components/WalletModalProvider';
import { AuthProvider, useAuth } from '@/contexts';

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardContent({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-50">
        <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <WalletModalProvider>
      <div className="flex h-screen bg-gray-900" dir="rtl">
        <DashboardSidebar userData={user} />
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </WalletModalProvider>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}