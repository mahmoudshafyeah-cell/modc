// src/app/products/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // العميل العمومي – لا يحتاج توكن
import ProductBanner from './components/ProductBanner';
import TickerBar from './components/TickerBar';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [activeFilter]);

  async function fetchCategories() {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (!error) setCategories(data || []);
  }

  async function fetchProducts() {
    setLoading(true);
    let query = supabase.from('products').select('*');
    if (activeFilter !== 'all') {
      query = query.eq('category_id', activeFilter);
    }
    const { data, error } = await query.limit(100);
    if (!error) setProducts(data || []);
    setLoading(false);
  }

  let filtered = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );
  if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);

  const filterTabs = [
    { id: 'all', label: 'الكل' },
    ...categories.map(c => ({ id: c.id, label: `${c.icon || '📁'} ${c.name_ar || c.name}` })),
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductBanner />
        <TickerBar />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 my-6">
          <h1 className="text-3xl font-bold text-white">منتجاتنا</h1>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث عن منتج..."
                className="w-64 pr-9 py-2 rounded-xl bg-gray-800/50 border border-gray-700 text-white text-sm focus:border-cyan-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-4 py-2 rounded-xl bg-gray-800/50 border border-gray-700 text-white text-sm"
            >
              <option value="default">الافتراضي</option>
              <option value="price-asc">السعر: من الأقل إلى الأعلى</option>
              <option value="price-desc">السعر: من الأعلى إلى الأقل</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pb-4 overflow-x-auto mb-8">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeFilter === tab.id
                  ? 'bg-cyan-600 text-white shadow-cyan-500/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/30 rounded-2xl">
            <div className="text-6xl mb-3">🔍</div>
            <h3 className="text-xl font-bold text-white">لا توجد منتجات</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
            {filtered.map(product => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-2xl overflow-hidden backdrop-blur-sm border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-cyan-500/10"
              >
                <div className="h-44 flex items-center justify-center text-6xl bg-gradient-to-br from-cyan-900/20 to-blue-900/20">
                  {product.image || product.emoji || '🎁'}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-white text-lg line-clamp-1">{product.name}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-2xl font-black text-cyan-400">${product.price}</span>
                    <span className="flex items-center gap-1 text-xs bg-cyan-500/10 px-2 py-1 rounded-full text-cyan-400">
                      <Zap size={12} /> {product.delivery_time || 'فوري'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}