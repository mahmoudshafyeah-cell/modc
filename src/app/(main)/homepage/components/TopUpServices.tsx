'use client';
import React from 'react';
import Link from 'next/link';
import { Zap, ArrowLeft } from 'lucide-react';

const topups = [
  { id: 'topup-pubg', game: 'PUBG Mobile', emoji: '🎯', options: ['60 UC — $0.99', '300 UC — $4.99', '600 UC — $9.99', '1800 UC — $24.99'], color: '#6C3AFF', popular: '600 UC' },
  { id: 'topup-ff', game: 'Free Fire', emoji: '🔥', options: ['100 ماسة — $0.99', '500 ماسة — $4.50', '1000 ماسة — $7.50', '2000 ماسة — $13.99'], color: '#FF6B35', popular: '1000 ماسة' },
  { id: 'topup-mlbb', game: 'Mobile Legends', emoji: '⚔️', options: ['86 ماسة — $1.49', '172 ماسة — $2.99', '500 ماسة — $7.99', '1000 ماسة — $14.99'], color: '#00D4FF', popular: '500 ماسة' },
  { id: 'topup-clash', game: 'Clash of Clans', emoji: '🏰', options: ['80 جواهر — $0.99', '500 جواهر — $4.99', '1200 جواهر — $9.99', '6500 جواهر — $49.99'], color: '#FFB800', popular: '1200 جواهر' },
];

export default function TopUpServices() {
  return (
    <section className="py-24 relative">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 xl:px-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4"
            style={{ background: 'rgba(0,255,148,0.1)', border: '1px solid rgba(0,255,148,0.25)', color: '#00FF94' }}>
            <Zap size={14} />
            <span>شحن فوري</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4">خدمات الشحن المباشر</h2>
          <p className="text-gray-400 text-lg">اشحن لعبتك المفضلة في ثوانٍ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {topups?.map(item => (
            <div key={item?.id} className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 group"
              style={{ background: 'rgba(17,17,40,0.9)', border: `1px solid ${item?.color}20` }}>
              {/* Header */}
              <div className="p-5 flex items-center gap-3 text-right"
                style={{ background: `linear-gradient(135deg, ${item?.color}15, ${item?.color}05)`, borderBottom: `1px solid ${item?.color}15` }}>
                <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{item?.emoji}</span>
                <div>
                  <h3 className="font-black text-white text-lg">{item?.game}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Zap size={12} style={{ color: item?.color }} />
                    <span className="text-xs" style={{ color: item?.color }}>تسليم فوري</span>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="p-4 space-y-2">
                {item?.options?.map(opt => {
                  const isPopular = opt?.startsWith(item?.popular);
                  return (
                    <Link key={`opt-${item?.id}-${opt}`} href="/sign-up-login-screen"
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group/opt"
                      style={{
                        background: isPopular ? `${item?.color}20` : 'rgba(255,255,255,0.03)',
                        border: isPopular ? `1px solid ${item?.color}40` : '1px solid rgba(255,255,255,0.06)',
                      }}>
                      <div className="flex items-center gap-2">
                        <ArrowLeft size={14} style={{ color: item?.color }} className="opacity-0 group-hover/opt:opacity-100 transition-opacity" />
                        {isPopular && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                            style={{ background: `${item?.color}30`, color: item?.color }}>
                            شائع
                          </span>
                        )}
                      </div>
                      <span className={`font-semibold ${isPopular ? 'text-white' : 'text-gray-300'}`}>{opt}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}