// src/app/products/[id]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('products').select('*').eq('id', id).single().then(({ data }) => {
      setProduct(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="text-center py-20">جاري التحميل...</div>;
  if (!product) return <div className="text-center py-20">المنتج غير موجود</div>;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <Link href="/products" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6">
          <ArrowRight size={16} /> العودة إلى المنتجات
        </Link>
        <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="md:flex">
            <div className="md:w-1/2 h-64 md:h-auto bg-gray-700 flex items-center justify-center">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <Package size={64} className="text-gray-500" />
              )}
            </div>
            <div className="p-6 md:p-8 text-right">
              <h1 className="text-3xl font-bold text-white mb-4">{product.name}</h1>
              <p className="text-gray-300 mb-6">{product.description}</p>
              <div className="text-2xl font-bold text-cyan-400 mb-6">${product.price}</div>
              <button className="px-6 py-3 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition">
                شراء الآن
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}