'use client';
import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react';

export default function AgentProfitStats() {
  const [stats, setStats] = useState({
    dailyProfit: 0,
    monthlyProfit: 0,
    dailySales: 0,
    activeCustomers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (error) {
      console.error('فشل جلب الإحصائيات:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="rounded-2xl p-5 animate-pulse bg-dark-100 border border-gray-700"><div className="w-10 h-10 bg-gray-700 rounded-xl mb-4" /><div className="h-8 w-20 bg-gray-700 rounded" /></div>)}
    </div>
  );

  const cards = [
    { icon: TrendingUp, value: `$${stats.dailyProfit.toFixed(2)}`, label: 'أرباح اليوم', color: '#00FF94', bg: 'rgba(0,255,148,0.1)', border: 'rgba(0,255,148,0.2)' },
    { icon: DollarSign, value: `$${stats.monthlyProfit.toFixed(2)}`, label: 'أرباح الشهر', color: '#00D4FF', bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.2)' },
    { icon: ShoppingCart, value: stats.dailySales.toString(), label: 'مبيعات اليوم', color: '#FFB800', bg: 'rgba(255,184,0,0.1)', border: 'rgba(255,184,0,0.2)' },
    { icon: Users, value: stats.activeCustomers.toString(), label: 'عملاء نشطون', color: '#6C3AFF', bg: 'rgba(108,58,255,0.12)', border: 'rgba(108,58,255,0.25)' },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1" style={{ background: card.bg, border: `1px solid ${card.border}` }}>
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}20`, border: `1px solid ${card.color}30` }}>
              <card.icon size={18} style={{ color: card.color }} />
            </div>
          </div>
          <p className="text-2xl font-black text-white tabular-nums mb-1">{card.value}</p>
          <p className="text-xs font-medium" style={{ color: card.color }}>{card.label}</p>
        </div>
      ))}
    </div>
  );
}