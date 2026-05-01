'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CategoriesSection() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('فشل جلب الفئات:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="py-24 relative">
        <div className="max-w-screen-2xl mx-auto px-6 text-center">
          <div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
        </div>
      </section>
    );
  }

  return (
    <section id="games" className="py-24 relative">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 xl:px-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4"
            style={{ background: 'rgba(108,58,255,0.1)', border: '1px solid rgba(108,58,255,0.25)', color: '#9B6BFF' }}>
            <span>🗂️</span>
            <span>تصفح حسب الفئة</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4">كل ما تحتاجه في مكان واحد</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">من ألعاب الفيديو إلى الكريبتو — ModC يغطي جميع احتياجاتك الرقمية</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {categories?.map(cat => {
            // تحديد href بناءً على id الفئة (يمكن تعديله لاحقاً)
            const href = `/homepage?category=${cat.id}`;
            return (
              <Link key={cat.id} href={href}
                className="group relative rounded-3xl p-7 overflow-hidden transition-all duration-300 hover:-translate-y-2 cursor-pointer block"
                style={{
                  background: `linear-gradient(135deg, ${cat.color}20, ${cat.color}05)`,
                  border: `1px solid ${cat.color}22`,
                  backdropFilter: 'blur(10px)',
                }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
                  style={{ boxShadow: `inset 0 0 40px ${cat.color}30` }} />

                <div className="text-5xl mb-5 group-hover:scale-110 transition-transform duration-300 inline-block">
                  {cat.icon || '📁'}
                </div>

                <h3 className="text-xl font-black text-white mb-2">{cat.name_ar}</h3>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">{cat.name}</p>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: cat.color }}>تصفح</span>
                  <div className="flex items-center gap-1 text-sm font-semibold transition-all duration-200 group-hover:gap-2"
                    style={{ color: cat.color }}>
                    <span>تصفح</span>
                    <ArrowLeft size={14} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}