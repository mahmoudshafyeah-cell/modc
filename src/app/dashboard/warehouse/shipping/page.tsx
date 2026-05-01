'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Truck } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

export default function ShippingOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase.from('shipping_orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('shipping_orders').update({ status }).eq('id', id);
    toast.success('تم تحديث الحالة');
    fetchOrders();
  }

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold text-white">طلبات الشحن</h1>
          <button onClick={fetchOrders} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600"><RefreshCw size={18} className="text-gray-300" /></button>
        </div>
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : orders.length===0 ? <div className="text-center text-gray-400">لا توجد طلبات شحن</div> :
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700"><tr><th className="p-3 text-right">العميل</th><th className="p-3 text-right">المنتج</th><th className="p-3 text-right">العنوان</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">تحديث الحالة</th></tr></thead>
              <tbody>
                {orders.map(o=>(
                  <tr key={o.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{o.customer_email}</td>
                    <td className="p-3 text-gray-300">{o.product_name}</td>
                    <td className="p-3 text-gray-300">{o.address}</td>
                    <td className="p-3"><span className="px-2 py-1 rounded-lg text-xs bg-yellow-600/20 text-yellow-400">{o.status}</span></td>
                    <td className="p-3">
                      <select value={o.status} onChange={e=>updateStatus(o.id, e.target.value)} className="p-1 rounded bg-gray-800 text-white border border-gray-700 text-sm">
                        <option value="pending">قيد الانتظار</option><option value="processing">قيد المعالجة</option><option value="shipped">تم الشحن</option><option value="delivered">تم التسليم</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </AuthGuard>
  );
}