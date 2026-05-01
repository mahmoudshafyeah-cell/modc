// المسار: src/app/(main)/agent-dashboard/components/AgentPayments.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  Search,
  ArrowDownCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Filter,
} from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  method_name: string;
  status: 'pending' | 'completed' | 'rejected';
  reference?: string;
  proof_url?: string;
  created_at: string;
  notes?: string;
}

export default function AgentPayments({ userData }: { userData: any }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  async function fetchPayments() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url = new URL('/api/transactions', window.location.origin);
      url.searchParams.set('userId', userData?.id);
      url.searchParams.set('type', 'deposit');
      url.searchParams.set('limit', '100');
      
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        let filtered = (data.transactions || []).map((tx: any) => ({
          id: tx.id,
          amount: tx.amount,
          method_name: tx.metadata?.method_name || 'طريقة دفع',
          status: tx.status,
          reference: tx.reference_id,
          proof_url: tx.metadata?.proof_url,
          created_at: tx.created_at,
          notes: tx.metadata?.reason,
        }));

        if (statusFilter !== 'all') {
          filtered = filtered.filter((p: Payment) => p.status === statusFilter);
        }

        setPayments(filtered);
      } else {
        toast.error(data.error || 'فشل جلب الدفعات');
      }
    } catch (error) {
      console.error('فشل جلب الدفعات:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = payments.filter(
    p =>
      !search ||
      p.method_name?.includes(search) ||
      p.reference?.includes(search) ||
      p.amount?.toString().includes(search)
  );

  const totalAmount = payments.reduce((s, p) => s + (p.status === 'completed' ? p.amount : 0), 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').length;
  const rejectedAmount = payments.filter(p => p.status === 'rejected').length;

  const statusLabels: Record<string, string> = {
    pending: 'قيد الانتظار',
    completed: 'مكتمل',
    rejected: 'مرفوض',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock size={14} className="text-yellow-400" />,
    completed: <CheckCircle size={14} className="text-green-400" />,
    rejected: <XCircle size={14} className="text-red-400" />,
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
    completed: 'bg-green-600/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-600/20 text-red-400 border-red-500/30',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ========== رأس الصفحة ========== */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(12, 113, 178, 0.15)', border: '1px solid rgba(12, 113, 178, 0.3)' }}
          >
            <FileText size={24} style={{ color: '#0c71b2' }} />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-white">دفعاتي</h1>
            <p className="text-sm text-gray-400">سجل عمليات الإيداع الخاصة بك</p>
          </div>
        </div>

        <div className="relative w-full md:w-48">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث..."
            className="input-field pr-9 text-right text-sm h-10 w-full"
          />
        </div>
      </div>

      {/* ========== إحصائيات سريعة ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'إجمالي المودع',
            value: `$${totalAmount.toFixed(2)}`,
            icon: DollarSign,
            color: '#00FF94',
          },
          {
            label: 'قيد الانتظار',
            value: pendingAmount,
            icon: Clock,
            color: '#FFB800',
          },
          {
            label: 'مكتملة',
            value: payments.filter(p => p.status === 'completed').length,
            icon: CheckCircle,
            color: '#00D4FF',
          },
          {
            label: 'مرفوضة',
            value: rejectedAmount,
            icon: XCircle,
            color: '#FF4466',
          },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-xl p-4 text-right"
            style={{ background: `${stat.color}10`, border: `1px solid ${stat.color}20` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-black text-white">{stat.value}</span>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ========== تبويبات الحالة ========== */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'pending', label: 'قيد الانتظار' },
          { id: 'completed', label: 'مكتملة' },
          { id: 'rejected', label: 'مرفوضة' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === f.id
                ? 'bg-cyan-600 text-white'
                : 'bg-dark-100 text-gray-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ========== جدول الدفعات ========== */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#111128', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-4 text-gray-400 text-sm">المبلغ</th>
                <th className="p-4 text-gray-400 text-sm">طريقة الدفع</th>
                <th className="p-4 text-gray-400 text-sm">المرجع</th>
                <th className="p-4 text-gray-400 text-sm">التاريخ</th>
                <th className="p-4 text-gray-400 text-sm">الحالة</th>
                <th className="p-4 text-gray-400 text-sm">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    <FileText size={48} className="mx-auto mb-3 text-gray-600" />
                    <p className="text-lg font-bold text-white mb-1">لا توجد دفعات</p>
                    <p className="text-sm">لم تقم بأي عمليات إيداع بعد</p>
                  </td>
                </tr>
              ) : (
                filtered.map(payment => (
                  <tr
                    key={payment.id}
                    className="border-b border-gray-800 hover:bg-cyan-500/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <ArrowDownCircle size={16} className="text-green-400" />
                        <span className="text-white font-bold">${payment.amount.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-300">{payment.method_name}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-400 text-xs" dir="ltr">
                        {payment.reference || '—'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(payment.created_at).toLocaleString('ar-SY')}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border ${
                          statusColors[payment.status]
                        }`}
                      >
                        {statusIcons[payment.status]}
                        {statusLabels[payment.status]}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">{payment.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}