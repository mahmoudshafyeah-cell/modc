'use client';
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Eye, RotateCcw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

type OrderStatus = 'completed' | 'pending' | 'processing' | 'cancelled' | 'refunded';

interface Order {
  id: string;
  product_name: string;
  category_name: string;
  emoji?: string;
  amount: number;
  status: OrderStatus;
  created_at: string;
  delivery_time?: string;
  code: string | null;
  payment_method: string;
}

interface OrdersTableProps {
  userId: string;
}

const statusConfig: Record<OrderStatus, { color: string; bg: string; border: string; label: string }> = {
  'completed': { color: '#00FF94', bg: 'rgba(0,255,148,0.12)', border: 'rgba(0,255,148,0.3)', label: 'مكتمل' },
  'pending': { color: '#FFB800', bg: 'rgba(255,184,0,0.12)', border: 'rgba(255,184,0,0.3)', label: 'معلق' },
  'processing': { color: '#00D4FF', bg: 'rgba(0,212,255,0.12)', border: 'rgba(0,212,255,0.3)', label: 'قيد المعالجة' },
  'cancelled': { color: '#FF4466', bg: 'rgba(255,68,102,0.12)', border: 'rgba(255,68,102,0.3)', label: 'ملغي' },
  'refunded': { color: '#9B6BFF', bg: 'rgba(155,107,255,0.12)', border: 'rgba(155,107,255,0.3)', label: 'مسترد' },
};

export default function OrdersTable({ userId }: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('الكل');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const perPage = 6;

  const statusOptions = ['الكل', 'مكتمل', 'معلق', 'قيد المعالجة', 'ملغي', 'مسترد'];

  useEffect(() => {
    if (!userId) return;
    fetchOrders();
  }, [userId]);

  async function fetchOrders() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/orders?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب الطلبات');
      setOrders(data.orders || []);
    } catch (error: any) {
      console.error('فشل جلب الطلبات:', error);
      toast.error('تعذر تحميل سجل الطلبات');
    } finally {
      setLoading(false);
    }
  }

  // تحويل حالة الطلب من الإنجليزية إلى العربية للعرض
  function getArabicStatus(status: OrderStatus): string {
    return statusConfig[status]?.label || status;
  }

  // تصفية وفرز
  const filtered = orders
    .filter(o => {
      const matchSearch = !search || o.product_name?.includes(search) || o.id?.includes(search);
      const matchStatus = statusFilter === 'الكل' || getArabicStatus(o.status) === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        return sortDir === 'desc'
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDir === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: 'date' | 'amount' }) =>
    sortField === field
      ? sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />
      : <ChevronDown size={14} className="opacity-30" />;

  if (loading) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: '#111128', border: '1px solid rgba(108,58,255,0.15)' }}>
        <div className="p-8 text-center text-gray-400">جاري تحميل الطلبات...</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: '#111128', border: '1px solid rgba(108,58,255,0.15)' }}>
        <div className="py-16 text-center">
          <div className="text-4xl mb-3">📭</div>
          <h3 className="text-lg font-bold text-white mb-1">لا توجد طلبات</h3>
          <p className="text-sm text-gray-400">لم تقم بأي طلب بعد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#111128', border: '1px solid rgba(108,58,255,0.15)' }}>
      {/* Header */}
      <div className="p-6 border-b flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
        style={{ borderColor: 'rgba(108,58,255,0.12)' }}>
        <div>
          <h3 className="text-lg font-black text-white">سجل الطلبات</h3>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} طلب إجمالاً</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="ابحث برقم الطلب أو المنتج..."
              className="input-field pr-9 text-right text-sm w-full sm:w-56" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {statusOptions.map(s => (
              <button key={`filter-status-${s}`} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${statusFilter === s ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                style={statusFilter === s
                  ? { background: 'rgba(108,58,255,0.3)', border: '1px solid rgba(108,58,255,0.5)' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full" dir="rtl">
          <thead>
            <tr style={{ background: 'rgba(108,58,255,0.06)', borderBottom: '1px solid rgba(108,58,255,0.1)' }}>
              {[
                { label: 'رقم الطلب', key: null },
                { label: 'المنتج', key: null },
                { label: 'الحالة', key: null },
                { label: 'المبلغ', key: 'amount' as const },
                { label: 'التاريخ', key: 'date' as const },
                { label: 'طريقة الدفع', key: null },
                { label: 'الإجراءات', key: null },
              ].map(col => (
                <th key={`th-${col.label}`}
                  className={`px-4 py-3 text-right text-xs font-bold uppercase tracking-wider ${col.key ? 'cursor-pointer hover:text-violet-300 transition-colors' : ''}`}
                  style={{ color: 'rgba(108,58,255,0.7)' }}
                  onClick={() => col.key && toggleSort(col.key)}>
                  <div className="flex items-center gap-1 justify-end">
                    {col.key && <SortIcon field={col.key} />}
                    {col.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ divideColor: 'rgba(108,58,255,0.06)' }}>
            {paginated.map(order => {
              const sc = statusConfig[order.status];
              const isExpanded = expandedRow === order.id;
              const formattedDate = new Date(order.created_at).toLocaleDateString('ar-SY');
              return (
                <React.Fragment key={order.id}>
                  <tr className="transition-colors hover:bg-violet-500/5 cursor-pointer"
                    onClick={() => setExpandedRow(isExpanded ? null : order.id)}>
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm font-semibold text-violet-300">{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white leading-tight">{order.product_name}</p>
                          <p className="text-xs text-gray-500">{order.category_name || 'غير مصنف'}</p>
                        </div>
                        <span className="text-xl">{order.emoji || '📦'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold"
                        style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-white tabular-nums">${order.amount.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-300" dir="ltr">{formattedDate}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-400">{order.payment_method}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-violet-500/20 transition-all"
                          title="عرض التفاصيل">
                          <Eye size={14} />
                        </button>
                        {order.status === 'completed' && order.code && (
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                            title="تحميل الكود"
                            onClick={() => alert(`الكود: ${order.code}`)}>
                            <Download size={14} />
                          </button>
                        )}
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                            title="تحديث الحالة">
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr style={{ background: 'rgba(108,58,255,0.04)' }}>
                      <td colSpan={7} className="px-6 py-4">
                        <div className="flex flex-wrap gap-6 justify-end text-right">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">وقت التسليم</p>
                            <p className="text-sm font-semibold text-white">{order.delivery_time || 'فوري'}</p>
                          </div>
                          {order.code && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">الكود / المعرف</p>
                              <p className="text-sm font-mono font-bold text-cyan-400" dir="ltr">{order.code}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500 mb-1">طريقة الدفع</p>
                            <p className="text-sm font-semibold text-white">{order.payment_method}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">رقم الطلب</p>
                            <p className="text-sm font-mono font-bold text-violet-300">{order.id}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="text-lg font-bold text-white mb-1">لا توجد نتائج</h3>
            <p className="text-sm text-gray-400">لا توجد طلبات تطابق معايير البحث الحالية</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: 'rgba(108,58,255,0.1)' }}>
          <span className="text-xs text-gray-400">
            عرض {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} من {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-violet-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronRight size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={`page-${p}`} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${page === p ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-violet-500/10'}`}
                style={page === p ? { background: 'rgba(108,58,255,0.4)', border: '1px solid rgba(108,58,255,0.6)' } : {}}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-violet-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}