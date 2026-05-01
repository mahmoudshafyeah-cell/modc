'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Zap, Shield, Clock, TrendingUp, Star } from 'lucide-react';

export default function HeroSection() {
  const [stats, setStats] = useState({ users: 0, products: 0 });
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    fetchStats();
    fetchFeaturedProducts();
  }, []);

  async function fetchStats() {
    try {
      const [usersRes, productsRes] = await Promise.all([
        fetch('/api/stats/users'),
        fetch('/api/stats/products'),
      ]);
      const usersData = await usersRes.json();
      const productsData = await productsRes.json();
      setStats({ users: usersData.count || 0, products: productsData.count || 0 });
    } catch (error) {
      console.error('فشل جلب الإحصائيات:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFeaturedProducts() {
    try {
      const res = await fetch('/api/products?limit=3');
      const data = await res.json();
      if (res.ok && data.products?.length > 0) {
        setFeaturedProducts(data.products);
      }
    } catch (error) {
      console.error('فشل جلب المنتجات المميزة:', error);
    }
  }

  // تدوير البطاقات تلقائياً كل 3 ثوانٍ
  useEffect(() => {
    if (featuredProducts.length === 0) return;
    const interval = setInterval(() => {
      setActiveCard((c) => (c + 1) % featuredProducts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [featuredProducts]);

  const statsItems = [
    { value: `+${stats.users.toLocaleString()}`, label: 'عميل نشط', icon: '👥' },
    { value: `+${stats.products.toLocaleString()}`, label: 'منتج رقمي', icon: '🎮' },
    { value: '99.9%', label: 'وقت التشغيل', icon: '⚡' },
    { value: '<2 دقيقة', label: 'وقت التسليم', icon: '🚀' },
  ];

  const currentProduct = featuredProducts[activeCard];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 60% 20%, rgba(108,58,255,0.25) 0%, rgba(0,212,255,0.08) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 20% 80%, rgba(0,212,255,0.12) 0%, transparent 50%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(108,58,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(108,58,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div
        className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(108,58,255,0.6), transparent)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute bottom-1/3 left-1/3 w-48 h-48 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,255,0.6), transparent)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 lg:px-10 xl:px-16 py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-right">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                background: 'rgba(108,58,255,0.15)',
                border: '1px solid rgba(108,58,255,0.35)',
                color: '#B899FF',
              }}
            >
              <Zap size={14} className="text-cyan-400" />
              <span>منصة #1 في سوريا للمنتجات الرقمية</span>
            </div>

            <div>
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-tight">
                <span className="text-white">اشحن وتسوّق</span>
                <br />
                <span className="text-gradient-violet">بكل سهولة</span>
              </h1>
              <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-xl mr-auto">
                محفظتك الرقمية لشراء بطاقات الألعاب، بطاقات الهدايا، خدمات الكريبتو والرموز الرقمية. سريع، آمن، وموثوق.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-end">
              <Link
                href="/sign-up-login-screen"
                className="btn-primary text-base px-8 py-4 flex items-center gap-2"
              >
                <span>ابدأ الآن مجاناً</span>
                <ArrowLeft size={18} />
              </Link>
              <Link
                href="/products"
                className="btn-ghost text-base px-8 py-4 flex items-center gap-2"
              >
                <span>تصفح المنتجات</span>
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 justify-end">
              {[
                { icon: <Shield size={14} />, label: 'دفع آمن 100%' },
                { icon: <Clock size={14} />, label: 'تسليم فوري' },
                { icon: <Star size={14} />, label: 'دعم 24/7' },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-1.5 text-sm text-gray-400">
                  <span className="text-violet-400">{b.icon}</span>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div
              className="relative w-full max-w-sm animate-float"
              style={{ filter: 'drop-shadow(0 32px 64px rgba(108,58,255,0.4))' }}
            >
              <div
                className="rounded-3xl p-8 text-right"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(108,58,255,0.3), rgba(0,212,255,0.15))',
                  border: '1px solid rgba(108,58,255,0.4)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  >
                    <span className="text-lg">💳</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">رصيد المحفظة</p>
                    <p className="text-3xl font-black text-white tabular-nums">$248.50</p>
                  </div>
                </div>
                <div
                  className="flex justify-between items-center pt-4"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="flex gap-2">
                    {['إيداع', 'سحب', 'تحويل'].map((a) => (
                      <span
                        key={a}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{
                          background: 'rgba(108,58,255,0.25)',
                          color: '#B899FF',
                          border: '1px solid rgba(108,58,255,0.3)',
                        }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-green-400 text-sm font-semibold">
                    <TrendingUp size={14} />
                    <span>+12.4%</span>
                  </div>
                </div>
              </div>
              {currentProduct && (
                <div
                  className="absolute -bottom-6 -right-6 rounded-2xl p-4 min-w-[180px]"
                  style={{
                    background: '#111128',
                    border: '1px solid rgba(108,58,255,0.3)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{currentProduct.image || '📦'}</span>
                    <div>
                      <p className="text-xs text-gray-400">{currentProduct.name}</p>
                      <p className="text-sm font-bold text-white">
                        {currentProduct.description?.slice(0, 20) || 'منتج مميز'}
                      </p>
                      <p className="text-xs font-semibold text-cyan-400">
                        ${currentProduct.price}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsItems.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-5 text-center transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(17,17,40,0.6)',
                border: '1px solid rgba(108,58,255,0.15)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-black text-white tabular-nums">
                {loading ? '...' : stat.value}
              </div>
              <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}