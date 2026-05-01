'use client';
import dynamic from 'next/dynamic';
import AuthLoading from '@/app/auth/loading';

const ProductsContent = dynamic(() => import('./ProductsContent'), {
  ssr: false,
  loading: () => <AuthLoading />,
});

export default function ProductsPage() {
  return <ProductsContent />;
}