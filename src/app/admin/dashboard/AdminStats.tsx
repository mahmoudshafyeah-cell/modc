'use client';
import { useEffect, useState } from 'react';
import { Users, TrendingUp, AlertCircle, Package } from 'lucide-react';

export default function AdminStats() {
  const [stats, setStats] = useState({ totalUsers: 0, monthlyRevenue: 0, pendingDeposits: 0, activeProducts: 0 });
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  const cards = [
    { label: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users, color: '#6C3AFF' },
    { label: 'إيرادات الشهر', value: `$${stats.monthlyRevenue}`, icon: TrendingUp, color: '#00FF94' },
    { label: 'طلبات إيداع معلقة', value: stats.pendingDeposits, icon: AlertCircle, color: '#FFB800' },
    { label: 'منتجات نشطة', value: stats.activeProducts, icon: Package, color: '#00D4FF' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="rounded-2xl p-5 bg-dark-100 border border-violet-500/20">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}20` }}>
              <card.icon size={20} style={{ color: card.color }} />
            </div>
            <span className="text-2xl font-bold text-white">{card.value}</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">{card.label}</p>
        </div>
      ))}
    </div>
  );
}