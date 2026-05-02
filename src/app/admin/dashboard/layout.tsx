'use client';
import { ReactNode } from 'react';
import AdminGuard from '@/components/AdminGuard';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-900" dir="rtl">
        {children}
      </div>
    </AdminGuard>
  );
}