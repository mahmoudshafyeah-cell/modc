// src/app/products/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Zap } from 'lucide-react';
import ProductBanner from './components/ProductBanner';
import TickerBar from './components/TickerBar';
import DashboardSidebar from '@/app/(main)/customer-dashboard/components/DashboardSidebar';
import DashboardTopbar from '@/app/(main)/customer-dashboard/components/DashboardTopbar';
import { jwtDecode } from 'jwt-decode';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserData(decoded);
      } catch {}
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [activeFilter]);

  const getHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) setCategories(data.categories || []);
    } catch {}
  }

  async function fetchProducts() {
    setLoading(true);
    try {
      const url = activeFilter === 'all'
        ? '/api/products?limit=100'
        : `/api/products?category=${activeFilter}&limit=100`;
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) setProducts(data.products || []);
    } catch (error) {
      console.error('فشل جلب المنتجات:', error);
    } finally {
      setLoading(false);
    }
  }

  let filtered = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);

  const filterTabs = [
    { id: 'all', label: 'الكل' },
    ...categories.map(c => ({ id: c.id, label: `${c.icon || '📁'} ${c.name_ar}` }))
  ];

  const content = (
    <div className="space-y-6" dir="rtl">
      <ProductBanner />
      <TickerBar />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">المنتجات</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full pr-10 py-3 rounded-xl bg-dark-100 border border-gray-700 text-white"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="p-3 rounded-xl bg-dark-100 border border-gray-700 text-white text-sm"
          >
            <option value="default">الافتراضي</option>
            <option value="price-asc">السعر: من الأقل إلى الأعلى</option>
            <option value="price-desc">السعر: من الأعلى إلى الأقل</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeFilter === tab.id ? 'bg-violet-600 text-white' : 'bg-dark-100 text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white">لا توجد منتجات</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(product => {
            const color = product.categories?.color || '#6C3AFF';
            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 block"
                style={{ background: 'rgba(17,17,40,0.9)', border: '1px solid rgba(108,58,255,0.12)' }}
              >
                <div
                  className="h-40 flex items-center justify-center text-6xl"
                  style={{ background: `linear-gradient(135deg, ${color}18, ${color}08)` }}
                >
                  {product.image || '📦'}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-white">{product.name}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-black text-white">${product.price}</span>
                    <span className="flex items-center gap-1 text-xs text-violet-400">
                      <Zap size={12} />
                      {product.delivery_time || 'فوري'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );

  if (userData) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: '#0A0A14' }} dir="rtl">
        <DashboardSidebar userData={userData} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <DashboardTopbar userData={userData} />
          <main className="flex-1 overflow-y-auto p-6">{content}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50 py-12" dir="rtl">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">{content}</div>
    </div>
  );
}