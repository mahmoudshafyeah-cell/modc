// src/app/products/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import BuyButton from './BuyButton';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  async function fetchProduct() {
    try {
      const res = await fetch(`/api/products?limit=100`);
      const data = await res.json();
      if (res.ok) {
        const found = data.products?.find((p: any) => p.id === id);
        setProduct(found || null);
      }
    } catch (error) {
      console.error('فشل جلب المنتج:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );

  if (!product)
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-xl font-bold text-white">المنتج غير موجود</h3>
        <Link href="/products" className="text-violet-400 mt-4 inline-block">
          العودة للمنتجات
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-dark-50 py-12" dir="rtl">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 mb-6"
        >
          <ArrowRight size={16} /> العودة للمنتجات
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div
            className="rounded-2xl p-8 flex items-center justify-center text-8xl"
            style={{
              background: 'rgba(17,17,40,0.9)',
              border: '1px solid rgba(108,58,255,0.2)',
              minHeight: '300px',
            }}
          >
            {product.image || '📦'}
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-white">{product.name}</h1>
            <p className="text-gray-400">{product.description || 'لا يوجد وصف'}</p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Zap size={14} className="text-cyan-400" />
              <span>{product.delivery_time || 'تسليم فوري'}</span>
            </div>
            <div className="text-4xl font-black text-white">${product.price}</div>
            <BuyButton
              productId={product.id}
              price={product.price}
              stock={product.stock || 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}