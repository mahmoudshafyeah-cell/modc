'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import DashboardSidebar from './customer-dashboard/components/DashboardSidebar';
import DashboardTopbar from './customer-dashboard/components/DashboardTopbar';
import { jwtDecode } from 'jwt-decode';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { setLoading(false); return; }
    try {
      const decoded = jwtDecode(token);
      setUserData(decoded);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  if (loading) return null;

  const publicPages = ['/homepage', '/sign-up-login-screen', '/legal', '/auth'];
  const isPublic = publicPages.some(p => pathname.startsWith(p));
  const isAgent = pathname.startsWith('/agent-dashboard');

  if (!userData || isPublic || isAgent) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0A0A14' }} dir="rtl">
      <DashboardSidebar userData={userData} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardTopbar userData={userData} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}