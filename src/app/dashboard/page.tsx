'use client';
import dynamic from 'next/dynamic';
import AuthLoading from '@/app/auth/loading';

const DashboardContent = dynamic(() => import('./DashboardContent'), {
  ssr: false,
  loading: () => <AuthLoading />,
});

export default function DashboardPage() {
  return <DashboardContent />;
}