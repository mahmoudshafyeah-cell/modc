'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export default function AgentDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/sign-up-login-screen');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== 'agent' && decoded.role !== 'super_admin') {
        router.replace('/customer-dashboard');
      }
    } catch (e) {
      router.replace('/sign-up-login-screen');
    }
  }, [router]);

  return <>{children}</>;
}