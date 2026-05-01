// src/app/dashboard/layout.tsx
'use client';
import { ReactNode } from 'react';
import DashboardSidebar from './components/DashboardSidebar';
import { WalletModalProvider } from './components/WalletModalProvider';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // مؤقتًا، نقوم بتمرير null لأن DashboardSidebar يتعامل مع userData كاختياري
  // وسيتم دمجه مع نظام المصادقة الحقيقي لاحقًا
  return (
    <WalletModalProvider>
      <div className="flex h-screen bg-gray-900" dir="rtl">
        <DashboardSidebar userData={null} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </WalletModalProvider>
  );
}