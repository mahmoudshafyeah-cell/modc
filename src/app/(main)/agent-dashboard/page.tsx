'use client';
import dynamic from 'next/dynamic';
import AuthLoading from '@/app/auth/loading';

const AgentDashboardContent = dynamic(
  () => import('./AgentDashboardContent'),
  {
    ssr: false,
    loading: () => <AuthLoading />,
  }
);

export default function AgentDashboardPage() {
  return <AgentDashboardContent />;
}