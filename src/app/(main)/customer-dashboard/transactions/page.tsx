// المسار: src/app/(main)/customer-dashboard/transactions/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, ShoppingBag, RefreshCw, Plus, Minus } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

type TxType = 'deposit' | 'withdrawal' | 'transfer' | 'purchase' | 'refund' | 'admin_deposit' | 'admin_withdrawal';

interface Transaction {
  id: string;
  type: TxType;
  description: string;
  amount: number;
  direction: 'in' | 'out';
  created_at: string;
  status: 'completed' | 'pending' | 'failed' | 'rejected';
  balance_after: number;
  balance_before: number;
}

const txConfig: Record<TxType, { icon: React.ReactNode; color: string; label: string }> = {
  deposit: { icon: <ArrowDownCircle size={16} />, color: '#00FF94', label: 'إيداع' },
  withdrawal: { icon: <ArrowUpCircle size={16} />, color: '#FF4466', label: 'سحب' },
  transfer: { icon: <ArrowLeftRight size={16} />, color: '#FFB800', label: 'تحويل' },
  purchase: { icon: <ShoppingBag size={16} />, color: '#6C3AFF', label: 'شراء' },
  refund: { icon: <RefreshCw size={16} />, color: '#9B6BFF', label: 'استرداد' },
  admin_deposit: { icon: <Plus size={16} />, color: '#00FF94', label: 'إضافة رصيد إداري' },
  admin_withdrawal: { icon: <Minus size={16} />, color: '#FF4466', label: 'استرداد رصيد إداري' },
};

const statusLabels: Record<string, string> = {
  completed: 'مكتمل',
  pending: 'قيد الانتظار',
  failed: 'فشل',
  rejected: 'مرفوض',
};

const statusColors: Record<string, string> = {
  completed: 'bg-green-600/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
  failed: 'bg-red-600/20 text-red-400 border-red-500/30',
  rejected: 'bg-red-600/20 text-red-400 border-red-500/30',
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded = jwtDecode<{ id: string }>(token);
        fetchTransactions(decoded.id);
      } catch (e) {
        toast.error('فشل قراءة بيانات المستخدم');
      }
    }
  }, []);

  async function fetchTransactions(userId: string) {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/transactions?userId=${userId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب المعاملات');
      setTransactions(data.transactions || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-white mb-6">سجل المعاملات</h1>

      {/* فلترة حسب النوع */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'deposit', label: 'إيداع' },
          { id: 'withdrawal', label: 'سحب' },
          { id: 'transfer', label: 'تحويل' },
          { id: 'purchase', label: 'شراء' },
          { id: 'admin_deposit', label: 'إضافة إدارية' },
          { id: 'admin_withdrawal', label: 'خصم إداري' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f.id ? 'bg-violet-600 text-white' : 'bg-dark-100 text-gray-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* جدول المعاملات */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#111128', border: '1px solid rgba(108,58,255,0.15)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-4 text-gray-400">النوع</th>
                <th className="p-4 text-gray-400">المبلغ</th>
                <th className="p-4 text-gray-400">الرصيد قبل</th>
                <th className="p-4 text-gray-400">الرصيد بعد</th>
                <th className="p-4 text-gray-400">التاريخ</th>
                <th className="p-4 text-gray-400">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => {
                const cfg = txConfig[tx.type] || { icon: <RefreshCw size={16} />, color: '#6B7280', label: tx.type };
                return (
                  <tr key={tx.id} className="border-b border-gray-800 hover:bg-violet-500/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span style={{ color: cfg.color }}>{cfg.icon}</span>
                        <span className="text-white text-sm">{cfg.label}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm font-bold ${tx.direction === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.direction === 'in' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">${(tx.balance_before || 0).toFixed(2)}</td>
                    <td className="p-4 text-white text-sm">${(tx.balance_after || 0).toFixed(2)}</td>
                    <td className="p-4 text-gray-400 text-xs">{new Date(tx.created_at).toLocaleString('ar-SY')}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs border ${statusColors[tx.status] || 'bg-gray-600/20 text-gray-400 border-gray-500/30'}`}>
                        {statusLabels[tx.status] || tx.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="p-8 text-gray-400 text-center">لا توجد معاملات</p>}
      </div>
    </div>
  );
}