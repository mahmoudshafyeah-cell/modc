'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import jwt from 'jsonwebtoken';

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo: string;
}

export default function AuthGuard({ children, allowedRoles, redirectTo }: Props) {
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
      const decoded = jwt.decode(token) as { role: string };
      if (!decoded || !allowedRoles.includes(decoded.role)) {
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