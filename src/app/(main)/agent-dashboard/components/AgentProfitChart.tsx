'use client';
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AgentProfitChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  async function fetchChartData() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/profit-history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok) setData(result.data || []);
    } catch (error) {
      console.error('فشل جلب بيانات الرسم:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl p-6 animate-pulse" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
        <div className="h-4 w-32 bg-gray-700 rounded mb-4" />
        <div className="h-[220px] bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#00D4FF' }} />
            <span className="text-xs text-gray-400">المبيعات</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#00FF94' }} />
            <span className="text-xs text-gray-400">الأرباح ($)</span>
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-sm font-bold text-white">تتبع الأرباح الأسبوعية</h3>
          <p className="text-xs text-gray-400">آخر 7 أيام</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00FF94" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00FF94" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#111128', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '12px', color: '#fff' }}
            labelStyle={{ color: '#9CA3AF', fontSize: '12px' }}
          />
          <Area type="monotone" dataKey="profit" stroke="#00FF94" strokeWidth={2} fill="url(#profitGrad)" />
          <Area type="monotone" dataKey="sales" stroke="#00D4FF" strokeWidth={2} fill="url(#salesGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}