'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Truck } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

interface ShippingOrder {
  id: string;
  customer_email: string;
  product_name: string;
  address: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  created_at: string;
}

export default function ShippingOrdersPage() {
  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('shipping_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('فشل جلب طلبات الشحن');
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from('shipping_orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error('فشل تحديث الحالة');
    else {
      toast.success('تم تحديث الحالة');
      fetchOrders();
    }
  }

  const statusOptions = [
    { value: 'pending', label: 'قيد الانتظار', color: 'bg-yellow-600/20 text-yellow-400' },
    { value: 'processing', label: 'قيد المعالجة', color: 'bg-blue-600/20 text-blue-400' },
    { value: 'shipped', label: 'تم الشحن', color: 'bg-purple-600/20 text-purple-400' },
    { value: 'delivered', label: 'تم التسليم', color: 'bg-green-600/20 text-green-400' },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">طلبات الشحن</h1>
          <button onClick={fetchOrders} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600">
            <RefreshCw size={18} className="text-gray-300" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد طلبات شحن</div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-3 text-right">العميل</th>
                  <th className="p-3 text-right">المنتج</th>
                  <th className="p-3 text-right">العنوان</th>
                  <th className="p-3 text-right">الحالة</th>
                  <th className="p-3 text-right">تاريخ الطلب</th>
                  <th className="p-3 text-right">تحديث الحالة</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const currentStatus = statusOptions.find(s => s.value === order.status);
                  return (
                    <tr key={order.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-3 text-gray-300">{order.customer_email}</td>
                      <td className="p-3 text-gray-300">{order.product_name || '-'}</td>
                      <td className="p-3 text-gray-300">{order.address || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-lg text-xs ${currentStatus?.color || ''}`}>
                          {currentStatus?.label || order.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-300">{new Date(order.created_at).toLocaleString('ar-SY')}</td>
                      <td className="p-3">
                        <select
                          value={order.status}
                          onChange={e => updateStatus(order.id, e.target.value)}
                          className="p-1.5 rounded-lg bg-gray-800 text-white border border-gray-700 text-sm"
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}