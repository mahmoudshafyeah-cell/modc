'use client';
import React, { useEffect, useState } from 'react';
import { ShoppingCart, ArrowDownCircle, TrendingUp } from 'lucide-react';

const iconMap: Record<string, any> = {
  sell: ShoppingCart,
  buy: ArrowDownCircle,
  profit: TrendingUp,
};

export default function AgentTransactionFeed() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('فشل جلب المعاملات:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl p-6 animate-pulse" style={{ background: 'rgba(108,58,255,0.06)', border: '1px solid rgba(108,58,255,0.15)' }}>
        <div className="h-4 w-20 bg-gray-700 rounded mb-4" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-gray-700 rounded mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: 'rgba(108,58,255,0.06)', border: '1px solid rgba(108,58,255,0.15)' }}>
      <div className="flex items-center justify-between mb-5">
        <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-semibold">عرض الكل</button>
        <h3 className="text-sm font-bold text-white">آخر المعاملات</h3>
      </div>
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-4">لا توجد معاملات</p>
        ) : (
          transactions.map(tx => {
            const Icon = iconMap[tx.type] || TrendingUp;
            const color = tx.type === 'sell' ? '#FFB800' : '#00FF94';
            return (
              <div key={tx.id} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'rgba(108,58,255,0.08)' }}>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">${tx.amount}</p>
                    {tx.profit && <p className="text-xs text-green-400">+${tx.profit}</p>}
                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleTimeString('ar-SY')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{tx.desc}</p>
                    <p className="text-xs text-gray-400">{tx.customer}</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}