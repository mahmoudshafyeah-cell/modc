'use client';

import dynamic from 'next/dynamic';
import AuthLoading from '@/app/auth/loading';

const HomepageContent = dynamic(
  () => import('./HomepageContent'),
  {
    ssr: false,
    loading: () => <AuthLoading />,
  }
);

export default function HomepagePage() {
  return <HomepageContent />;
}