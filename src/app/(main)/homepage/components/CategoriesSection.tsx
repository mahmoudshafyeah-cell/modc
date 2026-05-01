'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const categories = [
  {
    id: 'cat-games',
    icon: '🎮',
    title: 'الألعاب',
    subtitle: 'PUBG, Free Fire, Fortnite, Valorant',
    count: '80+ لعبة',
    color: '#6C3AFF',
    glow: 'rgba(108,58,255,0.3)',
    gradient: 'linear-gradient(135deg, rgba(108,58,255,0.2), rgba(108,58,255,0.05))',
    href: '/homepage#games',
    tags: ['PUBG', 'Free Fire', 'Fortnite'],
  },
  {
    id: 'cat-giftcards',
    icon: '🎁',
    title: 'بطاقات الهدايا',
    subtitle: 'Amazon, iTunes, Google Play, Steam',
    count: '50+ بطاقة',
    color: '#00D4FF',
    glow: 'rgba(0,212,255,0.3)',
    gradient: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.03))',
    href: '/homepage#giftcards',
    tags: ['Amazon', 'iTunes', 'Steam'],
  },
  {
    id: 'cat-crypto',
    icon: '₿',
    title: 'خدمات الكريبتو',
    subtitle: 'USDT, BTC, ETH, شراء وبيع',
    count: '10+ عملة',
    color: '#FFB800',
    glow: 'rgba(255,184,0,0.3)',
    gradient: 'linear-gradient(135deg, rgba(255,184,0,0.15), rgba(255,184,0,0.03))',
    href: '/homepage#crypto',
    tags: ['USDT', 'BTC', 'ETH'],
  },
  {
    id: 'cat-apps',
    icon: '📱',
    title: 'تطبيقات ومتاجر',
    subtitle: 'Netflix, Spotify, Canva, Adobe',
    count: '30+ تطبيق',
    color: '#00FF94',
    glow: 'rgba(0,255,148,0.3)',
    gradient: 'linear-gradient(135deg, rgba(0,255,148,0.12), rgba(0,255,148,0.02))',
    href: '/homepage#apps',
    tags: ['Netflix', 'Spotify', 'Canva'],
  },
];

export default function CategoriesSection() {
  return (
    <section id="games" className="py-24 relative">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 xl:px-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4"
            style={{ background: 'rgba(108,58,255,0.1)', border: '1px solid rgba(108,58,255,0.25)', color: '#9B6BFF' }}>
            <span>🗂️</span>
            <span>تصفح حسب الفئة</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4">كل ما تحتاجه في مكان واحد</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">من ألعاب الفيديو إلى الكريبتو — ModC يغطي جميع احتياجاتك الرقمية</p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {categories?.map(cat => (
            <Link key={cat?.id} href={cat?.href}
              className="group relative rounded-3xl p-7 overflow-hidden transition-all duration-300 hover:-translate-y-2 cursor-pointer block"
              style={{
                background: cat?.gradient,
                border: `1px solid ${cat?.color}22`,
                backdropFilter: 'blur(10px)',
              }}>
              {/* Glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
                style={{ boxShadow: `inset 0 0 40px ${cat?.glow}` }} />

              {/* Icon */}
              <div className="text-5xl mb-5 group-hover:scale-110 transition-transform duration-300 inline-block">
                {cat?.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-black text-white mb-2">{cat?.title}</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">{cat?.subtitle}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {cat?.tags?.map(tag => (
                  <span key={`tag-${cat?.id}-${tag}`} className="px-2 py-0.5 rounded-md text-xs font-semibold"
                    style={{ background: `${cat?.color}18`, color: cat?.color, border: `1px solid ${cat?.color}30` }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: cat?.color }}>{cat?.count}</span>
                <div className="flex items-center gap-1 text-sm font-semibold transition-all duration-200 group-hover:gap-2"
                  style={{ color: cat?.color }}>
                  <span>تصفح</span>
                  <ArrowLeft size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}