'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  role?: string;
  app_metadata?: { role?: string };
  user_metadata?: { role?: string };
}

export default function AuthGuard({ children, allowedRoles, redirectTo }: { children: React.ReactNode; allowedRoles: string[]; redirectTo: string }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace(redirectTo);
      return;
    }
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      // قراءة الدور من عدة أماكن محتملة
      const userRole = decoded.role || decoded.app_metadata?.role || decoded.user_metadata?.role;
      if (!userRole || !allowedRoles.includes(userRole)) {
        router.replace(redirectTo);
        return;
      }
      setIsAuthorized(true);
    } catch {
      router.replace(redirectTo);
    }
  }, [router, allowedRoles, redirectTo]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-50">
        <div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}