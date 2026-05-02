'use client';
import { ReactNode } from 'react';
import DashboardSidebar from './components/DashboardSidebar';
import AdminGuard from '@/components/AdminGuard';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-gray-900" dir="rtl">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </AdminGuard>
  );
}