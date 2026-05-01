'use client';
import AuthGuard from '@/components/AuthGuard';
import { WalletProvider } from './components/WalletContext';

export default function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['customer', 'agent', 'super_admin', 'staff']} redirectTo="/sign-up-login-screen">
      <WalletProvider>
        {children}
      </WalletProvider>
    </AuthGuard>
  );
}