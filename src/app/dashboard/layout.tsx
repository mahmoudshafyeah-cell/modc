// src/app/dashboard/layout.tsx
'use client';
import { useEffect, useState } from 'react';
import ThemeProvider from '@/components/ThemeProvider';
import { Toaster } from 'sonner';
import DashboardSidebar from './components/DashboardSidebar';
import { jwtDecode } from 'jwt-decode';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserData(decoded);
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-50">
        <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Toaster position="bottom-center" richColors />
      <div className="flex h-screen overflow-hidden" style={{ background: '#0A0A14' }} dir="rtl">
        <DashboardSidebar userData={userData} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}