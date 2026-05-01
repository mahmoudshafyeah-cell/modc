'use client';
import dynamic from 'next/dynamic';
import AuthLoading from '@/app/auth/loading';

const CustomerDashboardContent = dynamic(
  () => import('./CustomerDashboardContent'),
  {
    ssr: false,
    loading: () => <AuthLoading />,
  }
);

export default function CustomerDashboardPage() {
  return <CustomerDashboardContent />;
}