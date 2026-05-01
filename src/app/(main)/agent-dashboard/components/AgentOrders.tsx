// المسار: src/app/(main)/agent-dashboard/components/AgentOrders.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Package,
  Search,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Copy,
  Eye,
  Zap,
} from 'lucide-react';

interface Order {
  id: string;
  product_name: string;
  product_image?: string;
  amount: number;
  quantity: number;
  status: 'completed' | 'pending' | 'processing' | 'cancelled' | 'refunded';
  code?: string;
  payment_method: string;
  created_at: string;
  delivery_time?: string;
}

export default function AgentOrders({ userData }: { userData: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url = new URL('/api/orders', window.location.origin);
      url.searchParams.set('userId', userData?.id);
      url.searchParams.set('limit', '100');

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        let filtered = (data.orders || []).map((o: any) => ({
          id: o.id,
          product_name: o.product_name || o.products?.name || 'منتج',
          product_image: o.products?.image || o.products?.emoji || '📦',
          amount: o.amount,
          quantity: o.quantity || 1,
          status: o.status || 'completed',
          code: o.code,
          payment_method: o.payment_method || 'رصيد المحفظة',
          created_at: o.created_at,
          delivery_time: o.products?.delivery_time || 'فوري',
        }));

        if (statusFilter !== 'all') {
          filtered = filtered.filter((o: Order) => o.status === statusFilter);
        }

        setOrders(filtered);
      } else {
        toast.error(data.error || 'فشل جلب الطلبات');
      }
    } catch (error) {
      console.error('فشل جلب الطلبات:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = orders.filter(
    o =>
      !search ||
      o.product_name?.includes(search) ||
      o.id?.includes(search) ||
      o.code?.includes(search)
  );

  const totalSpent = orders
    .filter(o => o.status === 'completed')
    .reduce((s, o) => s + o.amount * o.quantity, 0);

  const statusLabels: Record<string, string> = {
    completed: 'مكتمل',
    pending: 'معلق',
    processing: 'قيد المعالجة',
    cancelled: 'ملغي',
    refunded: 'مسترجع',
  };

  const statusColors: Record<string, string> = {
    completed: 'bg-green-600/20 text-green-400 border-green-500/30',
    pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
    processing: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
    cancelled: 'bg-red-600/20 text-red-400 border-red-500/30',
    refunded: 'bg-gray-600/20 text-gray-400 border-gray-500/30',
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('تم نسخ الكود');
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
            <Package size={24} style={{ color: '#0c71b2' }} />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-white">طلباتي</h1>
            <p className="text-sm text-gray-400">سجل مشترياتك من المنصة</p>
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
          { label: 'إجمالي الطلبات', value: orders.length, icon: ShoppingBag, color: '#0c71b2' },
          { label: 'مكتملة', value: orders.filter(o => o.status === 'completed').length, icon: CheckCircle, color: '#00FF94' },
          { label: 'قيد المعالجة', value: orders.filter(o => o.status === 'processing' || o.status === 'pending').length, icon: Clock, color: '#FFB800' },
          { label: 'إجمالي المنفق', value: `$${totalSpent.toFixed(2)}`, icon: Zap, color: '#00D4FF' },
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
          { id: 'completed', label: 'مكتملة' },
          { id: 'processing', label: 'قيد المعالجة' },
          { id: 'pending', label: 'معلقة' },
          { id: 'cancelled', label: 'ملغية' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
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

      {/* ========== جدول الطلبات ========== */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#111128', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-4 text-gray-400 text-sm">المنتج</th>
                <th className="p-4 text-gray-400 text-sm">المبلغ</th>
                <th className="p-4 text-gray-400 text-sm">الكمية</th>
                <th className="p-4 text-gray-400 text-sm">طريقة الدفع</th>
                <th className="p-4 text-gray-400 text-sm">التاريخ</th>
                <th className="p-4 text-gray-400 text-sm">الحالة</th>
                <th className="p-4 text-gray-400 text-sm">الكود</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    <ShoppingBag size={48} className="mx-auto mb-3 text-gray-600" />
                    <p className="text-lg font-bold text-white mb-1">لا توجد طلبات</p>
                    <p className="text-sm">لم تقم بأي عمليات شراء بعد</p>
                  </td>
                </tr>
              ) : (
                filtered.map(order => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-800 hover:bg-cyan-500/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{order.product_image || '📦'}</span>
                        <div>
                          <p className="text-white font-medium">{order.product_name}</p>
                          {order.delivery_time && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Truck size={10} />
                              {order.delivery_time}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white font-bold">${order.amount.toFixed(2)}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white">×{order.quantity}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-400 text-sm">{order.payment_method}</span>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(order.created_at).toLocaleDateString('ar-SY')}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs border ${statusColors[order.status]}`}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="p-4">
                      {order.code ? (
                        <button
                          onClick={() => copyCode(order.code!)}
                          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                        >
                          {order.code.slice(0, 12)}...
                          <Copy size={12} />
                        </button>
                      ) : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== نافذة تفاصيل الطلب ========== */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm border"
            style={{ background: '#111128', borderColor: 'rgba(12, 113, 178, 0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle size={20} />
              </button>
              <h3 className="text-lg font-bold text-white">تفاصيل الطلب</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">المنتج</span>
                <span className="text-white font-bold">{selectedOrder.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">المبلغ</span>
                <span className="text-white">${selectedOrder.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">الكمية</span>
                <span className="text-white">×{selectedOrder.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">الحالة</span>
                <span className={statusColors[selectedOrder.status]?.split(' ')[1]}>{statusLabels[selectedOrder.status]}</span>
              </div>
              {selectedOrder.code && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">الكود</span>
                  <button
                    onClick={() => copyCode(selectedOrder.code!)}
                    className="text-cyan-400 font-mono text-sm flex items-center gap-1"
                  >
                    {selectedOrder.code}
                    <Copy size={12} />
                  </button>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">التاريخ</span>
                <span className="text-white">{new Date(selectedOrder.created_at).toLocaleString('ar-SY')}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full mt-6 py-2.5 rounded-xl bg-gray-700 text-white font-bold"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}