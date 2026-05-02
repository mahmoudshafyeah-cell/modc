'use client';
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    const token = localStorage.getItem('auth_token');
    
    if (!token || role !== 'super_admin') {
      router.replace('/admin/login');
    }
  }, [router]);

  return <>{children}</>;
}