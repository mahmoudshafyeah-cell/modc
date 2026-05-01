'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, Star, Zap } from 'lucide-react';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [activeFilter]);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (res.ok) setCategories(data.categories || []);
    } catch {}
  }

  async function fetchProducts() {
    setLoading(true);
    try {
      const url = activeFilter === 'all' ? '/api/products' : `/api/products?category=${activeFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setProducts(data.products || []);
    } catch (error) {
      console.error('فشل جلب المنتجات:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()));

  const filterTabs = [
    { id: 'all', label: 'الكل' },
    ...categories.map(c => ({ id: c.id, label: `${c.icon || '📁'} ${c.name_ar}` })),
  ];

  return (
    <section id="products" className="py-24 relative">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 xl:px-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-3" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}>
              <Zap size={14} /><span>المنتجات المميزة</span>
            </div>
            <h2 className="text-4xl font-black text-white">أبرز المنتجات</h2>
          </div>
          <div className="relative w-full lg:w-72">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن منتج..." className="input-field pr-10 text-right" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          {filterTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveFilter(tab.id)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeFilter === tab.id ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              style={activeFilter === tab.id ? { background: 'linear-gradient(135deg, #6C3AFF, #9B6BFF)' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16"><div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(product => {
              const category = categories.find(c => c.id === product.category_id);
              const color = category?.color || '#6C3AFF';
              return (
                <div key={product.id} className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2" style={{ background: 'rgba(17,17,40,0.9)', border: '1px solid rgba(108,58,255,0.12)' }}>
                  <div className="relative h-40 flex items-center justify-center text-6xl" style={{ background: `linear-gradient(135deg, ${color}18, ${color}08)` }}>
                    {product.badge && <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: product.badge === 'الأكثر مبيعاً' ? 'rgba(255,184,0,0.2)' : 'rgba(0,212,255,0.2)', color: product.badge === 'الأكثر مبيعاً' ? '#FFB800' : '#00D4FF' }}>{product.badge}</span>}
                    <span className="group-hover:scale-110 transition-transform">{product.image || '📦'}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-white text-base mb-1">{product.name}</h3>
                    <div className="flex items-center justify-end gap-1.5 mb-3"><Star size={12} className="text-amber-400 fill-amber-400" /><span className="text-xs text-gray-500">({product.reviews || 0})</span></div>
                    <div className="flex items-center justify-end gap-1.5 mb-4"><Zap size={12} className="text-cyan-400" /><span className="text-xs text-gray-500">{product.delivery_time || 'فوري'}</span></div>
                    <div className="flex items-center justify-between">
                      <Link href={`/products/${product.id}`} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}BB)` }}><ShoppingCart size={14} /><span>اشتر الآن</span></Link>
                      <div className="text-right">
                        {product.original_price && <p className="text-xs text-gray-500 line-through">${product.original_price}</p>}
                        <p className="text-lg font-black text-white">${product.price}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!loading && filtered.length === 0 && <div className="text-center py-16"><div className="text-5xl mb-4">🔍</div><h3 className="text-xl font-bold text-white mb-2">لا توجد نتائج</h3><p className="text-gray-400">جرب مصطلح بحث مختلف أو غيّر الفئة</p></div>}
      </div>
    </section>
  );
}