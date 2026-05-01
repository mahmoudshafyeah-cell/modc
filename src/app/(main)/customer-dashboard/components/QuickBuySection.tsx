'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, ArrowLeft } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  emoji?: string;
  color?: string;
  category_id?: string;
  categories?: { color?: string };
}

export default function QuickBuySection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products?limit=6');
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('فشل جلب المنتجات السريعة:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl p-5" style={{ background: '#111128', border: '1px solid rgba(108,58,255,0.15)' }}>
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl p-5" style={{ background: '#111128', border: '1px solid rgba(108,58,255,0.15)' }}>
        <div className="text-center py-8 text-gray-400 text-sm">لا توجد منتجات متاحة</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: '#111128', border: '1px solid rgba(108,58,255,0.15)' }}>
      <div className="flex items-center justify-between mb-4 text-right">
        <Link href="/homepage#products" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
          <span>عرض الكل</span>
          <ArrowLeft size={12} />
        </Link>
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-cyan-400" />
          <h3 className="text-base font-black text-white">شراء سريع</h3>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {products.map(p => {
          const color = p.categories?.color || p.color || '#6C3AFF';
          const displayPrice = typeof p.price === 'number' ? `$${p.price.toFixed(2)}` : '$--';
          const icon = p.image || p.emoji || '📦';
          
          return (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="group rounded-xl p-3 text-center transition-all duration-200 hover:scale-105 active:scale-95 hover:-translate-y-0.5"
              style={{ background: `${color}10`, border: `1px solid ${color}20` }}
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200 inline-block">
                {icon}
              </div>
              <p className="text-xs font-bold text-white leading-tight mb-0.5 line-clamp-1">{p.name}</p>
              <p className="text-xs font-semibold" style={{ color }}>{displayPrice}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}