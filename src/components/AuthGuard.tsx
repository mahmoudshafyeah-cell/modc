'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export default function AuthGuard({ children, allowedRoles, redirectTo }: { children: React.ReactNode; allowedRoles: string[]; redirectTo: string }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.replace(redirectTo);
        return;
      }
      try {
        // محاولة قراءة الدور من التوكن أولاً
        let role: string | null = null;
        try {
          const decoded: any = jwtDecode(token);
          role = decoded.role || decoded.app_metadata?.role || decoded.user_metadata?.role;
        } catch {}

        // إذا لم نجد الدور، نطلبه من API
        if (!role) {
          const res = await fetch('/api/user/role', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.role) role = data.role;
        }

        if (!role || !allowedRoles.includes(role)) {
          router.replace(redirectTo);
          return;
        }
        setIsAuthorized(true);
      } catch (error) {
        console.error('AuthGuard error:', error);
        router.replace(redirectTo);
      }
    };
    checkAuth();
  }, [router, allowedRoles, redirectTo]);

  if (!isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>;
  }
  return <>{children}</>;
}