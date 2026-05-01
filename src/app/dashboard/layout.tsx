'use client';
import { ReactNode } from 'react';
import DashboardSidebar from './components/DashboardSidebar';
import { WalletModalProvider } from './components/WalletModalProvider';
import { useAuth } from '@/contexts/AuthContext'; // تأكد من صحة المسار

export default function DashboardLayout({ children }: { children: ReactNode }) {
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
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </WalletModalProvider>
  );
}