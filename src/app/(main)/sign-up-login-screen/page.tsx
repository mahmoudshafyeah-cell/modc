'use client';

import dynamic from 'next/dynamic';
import AuthLoading from '@/app/auth/loading';

const SignUpLoginContent = dynamic(
  () => import('./SignUpLoginContent'),
  {
    ssr: false,
    loading: () => <AuthLoading />,
  }
);

export default function SignUpLoginPage() {
  return <SignUpLoginContent />;
}