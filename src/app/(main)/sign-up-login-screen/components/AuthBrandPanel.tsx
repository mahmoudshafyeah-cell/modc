import React from 'react';
import AppLogo from '@/components/ui/AppLogo';
import { Shield, Zap, Star, Users } from 'lucide-react';

const highlights = [
  { icon: <Zap size={18} />, text: 'تسليم فوري للمنتجات الرقمية', color: '#00D4FF' },
  { icon: <Shield size={18} />, text: 'محفظة آمنة ومشفرة بالكامل', color: '#6C3AFF' },
  { icon: <Star size={18} />, text: 'أكثر من 200 منتج رقمي متاح', color: '#FFB800' },
  { icon: <Users size={18} />, text: '+50,000 عميل موثوق في المنطقة', color: '#00FF94' },
];

export default function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0D0D22, #111128)', borderLeft: '1px solid rgba(108,58,255,0.2)' }}>
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(108,58,255,0.6), transparent)', filter: 'blur(60px)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.6), transparent)', filter: 'blur(40px)', transform: 'translate(-30%, 30%)' }} />
      <div className="absolute inset-0 opacity-3"
        style={{ backgroundImage: 'linear-gradient(rgba(108,58,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(108,58,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      {/* Logo */}
      <div className="relative">
        <div className="flex items-center gap-3 justify-end mb-3">
          <span className="font-display text-3xl font-black text-gradient-violet">ModC</span>
          <AppLogo size={44} />
        </div>
        <p className="text-gray-400 text-right text-sm">منصتك الرقمية الأولى في سوريا</p>
      </div>
      {/* Main visual */}
      <div className="relative flex items-center justify-center py-12">
        {/* Wallet mockup */}
        <div className="relative w-72 animate-float"
          style={{ filter: 'drop-shadow(0 24px 48px rgba(108,58,255,0.5))' }}>
          <div className="rounded-3xl p-8 text-right"
            style={{
              background: 'linear-gradient(135deg, rgba(108,58,255,0.35), rgba(0,212,255,0.15))',
              border: '1px solid rgba(108,58,255,0.5)',
              backdropFilter: 'blur(20px)',
            }}>
            <p className="text-xs text-gray-400 mb-1">رصيد محفظتك</p>
            <p className="text-4xl font-black text-white tabular-nums mb-1">$248.50</p>
            <p className="text-xs text-green-400 flex items-center justify-end gap-1">
              <span>▲</span> <span>+$12.40 هذا الأسبوع</span>
            </p>
            <div className="mt-6 flex gap-2">
              {['إيداع', 'سحب', 'تحويل']?.map(a => (
                <span key={`wallet-action-${a}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(108,58,255,0.25)', color: '#B899FF', border: '1px solid rgba(108,58,255,0.3)' }}>
                  {a}
                </span>
              ))}
            </div>
          </div>
          {/* Mini product card */}
          <div className="absolute -top-4 -left-4 rounded-xl p-3"
            style={{ background: '#111128', border: '1px solid rgba(0,212,255,0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <div>
                <p className="text-xs text-gray-400">PUBG Mobile</p>
                <p className="text-sm font-bold text-cyan-400">600 UC — $9.99</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Highlights */}
      <div className="relative space-y-4">
        {highlights?.map(h => (
          <div key={`highlight-${h?.text}`} className="flex items-center gap-3 justify-end">
            <p className="text-sm text-gray-300">{h?.text}</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${h?.color}18`, color: h?.color, border: `1px solid ${h?.color}30` }}>
              {h?.icon}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}