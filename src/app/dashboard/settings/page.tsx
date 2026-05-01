'use client';
import dynamic from 'next/dynamic';
import AuthLoading from '@/app/auth/loading';

const SettingsContent = dynamic(() => import('./SettingsContent'), {
  ssr: false,
  loading: () => <AuthLoading />,
});

export default function SettingsPage() {
  return <SettingsContent />;
}