'use client';
import { ReactNode } from 'react';
import DashboardSidebar from './components/DashboardSidebar';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-900" dir="rtl">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}