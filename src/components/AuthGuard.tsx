'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/lib/authHelpers';

export default function AuthGuard({ children, allowedRoles, redirectTo }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.replace(redirectTo);
        return;
      }
      const role = await getUserRole();
      if (!role || !allowedRoles.includes(role)) {
        router.replace(redirectTo);
        return;
      }
      setIsAuthorized(true);
    };
    checkAuth();
  }, []);

  if (!isAuthorized) return <div>Loading...</div>;
  return <>{children}</>;
}