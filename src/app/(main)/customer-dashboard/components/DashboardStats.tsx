'use client';
import React, { useEffect, useState } from 'react';
import { ShoppingBag, TrendingUp, Clock, PiggyBank } from 'lucide-react';

interface DashboardStatsProps {
  userId: string;
}

interface StatsData {
  total_spent: number;
  total_orders: number;
  pending_orders: number;
  total_saved: number;
}

export default function DashboardStats({ userId }: DashboardStatsProps) {
  const [stats, setStats] = useState<StatsData>({
    total_spent: 0,
    total_orders: 0,
    pending_orders: 0,
    total_saved: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchStats();
  }, [userId]);

  async function fetchStats() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/stats/dashboard?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب الإحصائيات');
      setStats(data);
    } catch (error) {
      console.error('فشل جلب الإحصائيات:', error);
    } finally {
      setLoading(false);
    }
  }

  const statsItems = [
    {
      id: 'stat-spent',
      label: 'إجمالي الإنفاق',
      value: `$${stats.total_spent.toFixed(2)}`,
      change: `+$${(stats.total_spent * 0.1).toFixed(2)} هذا الشهر`, // يمكن حسابه فعلياً من API
      positive: true,
      icon: TrendingUp,
      color: '#6C3AFF',
      bg: 'rgba(108,58,255,0.12)',
      border: 'rgba(108,58,255,0.25)',
    },
    {
      id: 'stat-orders',
      label: 'إجمالي الطلبات',
      value: stats.total_orders.toString(),
      change: `+${Math.floor(stats.total_orders * 0.2)} هذا الأسبوع`,
      positive: true,
      icon: ShoppingBag,
      color: '#00D4FF',
      bg: 'rgba(0,212,255,0.1)',
      border: 'rgba(0,212,255,0.2)',
    },
    {
      id: 'stat-pending',
      label: 'طلبات معلقة',
      value: stats.pending_orders.toString(),
      change: stats.pending_orders > 0 ? 'بانتظار المعالجة' : 'لا توجد طلبات معلقة',
      positive: false,
      icon: Clock,
      color: '#FFB800',
      bg: 'rgba(255,184,0,0.1)',
      border: 'rgba(255,184,0,0.2)',
    },
    {
      id: 'stat-saved',
      label: 'إجمالي التوفير',
      value: `$${stats.total_saved.toFixed(2)}`,
      change: 'من خلال العروض والكوبونات',
      positive: true,
      icon: PiggyBank,
      color: '#00FF94',
      bg: 'rgba(0,255,148,0.1)',
      border: 'rgba(0,255,148,0.2)',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-2xl p-5 bg-dark-100 border border-gray-700 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-700" />
              <div className="w-16 h-6 rounded-lg bg-gray-700" />
            </div>
            <div className="h-8 w-20 bg-gray-700 rounded mb-1" />
            <div className="h-4 w-24 bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {statsItems.map(stat => {
        const Icon = stat.icon;
        return (
          <div key={stat.id} className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}20`, border: `1px solid ${stat.color}30` }}>
                <Icon size={18} style={{ color: stat.color }} />
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                style={{
                  background: stat.positive ? 'rgba(0,255,148,0.1)' : 'rgba(255,184,0,0.1)',
                  color: stat.positive ? '#00FF94' : '#FFB800',
                }}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-black text-white tabular-nums mb-1">{stat.value}</p>
            <p className="text-xs font-medium" style={{ color: stat.color }}>{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}