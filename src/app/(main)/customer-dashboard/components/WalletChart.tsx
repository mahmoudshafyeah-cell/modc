'use client';
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, defs, linearGradient, stop
} from 'recharts';

const data = [
  { day: '8 أبر', balance: 188.49, spent: 30.00 },
  { day: '9 أبر', balance: 196.48, spent: 7.99 },
  { day: '10 أبر', balance: 180.49, spent: 15.99 },
  { day: '11 أبر', balance: 280.49, spent: 0 },
  { day: '12 أبر', balance: 260.49, spent: 20.00 },
  { day: '13 أبر', balance: 208.49, spent: 52.00 },
  { day: '14 أبر', balance: 248.50, spent: 9.99 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-right min-w-[140px]"
      style={{ background: '#1A1A35', border: '1px solid rgba(108,58,255,0.4)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {payload.map(entry => (
        <p key={`tooltip-${entry.name}`} className="text-sm font-bold tabular-nums" style={{ color: entry.color }}>
          {entry.name === 'balance' ? 'الرصيد' : 'الإنفاق'}: ${entry.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
};

export default function WalletChart() {
  return (
    <div className="rounded-2xl p-6" style={{ background: '#111128', border: '1px solid rgba(108,58,255,0.15)' }}>
      <div className="flex items-center justify-between mb-6 text-right">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#FF4466' }} />
            <span className="text-xs text-gray-400">الإنفاق</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#6C3AFF' }} />
            <span className="text-xs text-gray-400">الرصيد</span>
          </div>
        </div>
        <div>
          <h3 className="text-base font-black text-white">حركة المحفظة</h3>
          <p className="text-xs text-gray-400">آخر 7 أيام</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6C3AFF" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6C3AFF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF4466" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FF4466" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,58,255,0.1)" />
          <XAxis dataKey="day" tick={{ fill: '#666688', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#666688', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="balance" stroke="#6C3AFF" strokeWidth={2} fill="url(#gradBalance)" name="balance" />
          <Area type="monotone" dataKey="spent" stroke="#FF4466" strokeWidth={2} fill="url(#gradSpent)" name="spent" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}