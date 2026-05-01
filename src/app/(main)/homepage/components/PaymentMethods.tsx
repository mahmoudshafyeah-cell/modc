'use client';
import React, { useEffect, useState } from 'react';
import { Shield, Zap, Clock } from 'lucide-react';

export default function PaymentMethods() {
  const [methods, setMethods] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/payment-methods').then(res => res.json()).then(data => setMethods(data.methods || []));
  }, []);

  const features = [
    { icon: <Shield size={20} />, title: 'دفع آمن ومشفر', desc: 'جميع المعاملات مشفرة بأعلى معايير الأمان', color: '#6C3AFF' },
    { icon: <Zap size={20} />, title: 'تسليم فوري', desc: 'استلم منتجاتك خلال ثوانٍ من إتمام الدفع', color: '#00D4FF' },
    { icon: <Clock size={20} />, title: 'دعم على مدار الساعة', desc: 'فريق دعم جاهز 24/7 لمساعدتك', color: '#00FF94' },
  ];

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(108,58,255,0.08) 0%, transparent 70%)' }} />
      <div className="relative max-w-screen-2xl mx-auto px-6 lg:px-10 xl:px-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4" style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.25)', color: '#FFB800' }}>
            <span>💳</span><span>طرق الدفع المتاحة</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4">ادفع بالطريقة التي تناسبك</h2>
          <p className="text-gray-400 text-lg">ندعم أبرز طرق الدفع المحلية والعالمية في سوريا</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-16">
          {methods.map(m => (
            <div key={m.id} className="group rounded-2xl p-6 text-center transition-all hover:-translate-y-1" style={{ background: 'rgba(17,17,40,0.8)', border: `1px solid ${m.color || '#6C3AFF'}22` }}>
              <div className="text-4xl mb-4">{m.icon || '💳'}</div>
              <h3 className="font-bold text-white mb-1">{m.name_ar || m.name}</h3>
              <p className="text-xs text-gray-400 mb-4">{m.instructions || 'دفع آمن'}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: `${m.color || '#6C3AFF'}18`, color: m.color || '#6C3AFF' }}>متاح</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="flex items-start gap-4 p-6 rounded-2xl text-right" style={{ background: 'rgba(17,17,40,0.5)', border: '1px solid rgba(108,58,255,0.1)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${f.color}18`, color: f.color }}>{f.icon}</div>
              <div><h3 className="font-bold text-white mb-1">{f.title}</h3><p className="text-sm text-gray-400">{f.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}