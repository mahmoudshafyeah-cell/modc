'use client';
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/lib/roleGuard';

export default function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const role = getUserRole();
    const token = localStorage.getItem('auth_token');
    
    if (!token || role !== 'super_admin') {
      router.replace('/admin/login');
    }
  }, [router]);

  return <>{children}</>;
}