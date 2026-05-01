'use client';
import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, ShoppingBag, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type TxType = 'deposit' | 'withdrawal' | 'transfer' | 'purchase' | 'refund';

interface Transaction {
  id: string;
  type: TxType;
  description: string;
  amount: number;
  direction: 'in' | 'out';
  created_at: string;
  status: 'completed' | 'pending' | 'failed';
  balance_after: number;
}

interface TransactionFeedProps {
  userId: string;
}

const txConfig: Record<TxType, { icon: React.ReactNode; color: string; label: string }> = {
  'deposit': { icon: <ArrowDownCircle size={16} />, color: '#00FF94', label: 'إيداع' },
  'withdrawal': { icon: <ArrowUpCircle size={16} />, color: '#FF4466', label: 'سحب' },
  'transfer': { icon: <ArrowLeftRight size={16} />, color: '#FFB800', label: 'تحويل' },
  'purchase': { icon: <ShoppingBag size={16} />, color: '#6C3AFF', label: 'شراء' },
  'refund': { icon: <RefreshCw size={16} />, color: '#9B6BFF', label: 'استرداد' },
};

export default function TransactionFeed({ userId }: TransactionFeedProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchTransactions();
  }, [userId]);

  async function fetchTransactions() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/transactions?userId=${userId}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب المعاملات');
      setTransactions(data.transactions || []);
    } catch (error: any) {
      console.error('فشل جلب المعاملات:', error);
      toast.error('تعذر تحميل المعاملات');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: '#111128', border: '1px solid rgba(108,58,255,0.15)' }}>
        <div className="p-8 text-center text-gray-400">جاري تحميل المعاملات...</div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: '#111128', border: '1px solid rgba(108,58,255,0.15)' }}>
        <div className="p-8 text-center text-gray-400">لا توجد معاملات حديثة</div>
      </div>
    );
  }

  const displayed = showAll ? transactions : transactions.slice(0, 5);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#111128', border: '1px solid rgba(108,58,255,0.15)' }}>
      <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(108,58,255,0.1)' }}>
        <button onClick={() => setShowAll(s => !s)}
          className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
          {showAll ? 'عرض أقل' : 'عرض الكل'}
        </button>
        <div className="text-right">
          <h3 className="text-base font-black text-white">آخر المعاملات</h3>
          <p className="text-xs text-gray-400">{transactions.length} معاملة مؤخراً</p>
        </div>
      </div>

      <div className="divide-y" style={{ divideColor: 'rgba(108,58,255,0.06)' }}>
        {displayed.map(tx => {
          const cfg = txConfig[tx.type] || { icon: <RefreshCw size={16} />, color: '#6B7280', label: tx.type };
          const date = new Date(tx.created_at);
          const formattedDate = date.toLocaleDateString('ar-SY');
          const formattedTime = date.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' });
          
          return (
            <div key={tx.id} className="flex items-center justify-between px-5 py-4 hover:bg-violet-500/4 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <p className="text-xs text-gray-500 text-left" dir="ltr">{formattedTime}</p>
                  <p className="text-xs text-gray-600 text-left" dir="ltr">{formattedDate}</p>
                </div>
                <div className="text-right min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{tx.description || cfg.label}</p>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <span className="text-xs font-mono text-gray-500">{tx.id.slice(0, 8)}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                      tx.status === 'completed' ? 'text-green-400 bg-green-400/10' :
                      tx.status === 'pending' ? 'text-amber-400 bg-amber-400/10' : 'text-red-400 bg-red-400/10'
                    }`}>
                      {tx.status === 'completed' ? 'مكتمل' : tx.status === 'pending' ? 'معلق' : 'فاشل'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-left">
                  <p className={`text-base font-black tabular-nums ${tx.direction === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.direction === 'in' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 text-left">رصيد: ${tx.balance_after?.toFixed(2) ?? '---'}</p>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
                  {cfg.icon}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!showAll && transactions.length > 5 && (
        <div className="p-4 text-center border-t" style={{ borderColor: 'rgba(108,58,255,0.08)' }}>
          <button onClick={() => setShowAll(true)}
            className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors">
            عرض {transactions.length - 5} معاملات إضافية
          </button>
        </div>
      )}
    </div>
  );
}