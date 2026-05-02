'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*, assets(product_id), products(name)').order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  async function updateReturnStatus(orderId: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    toast.success('تم تحديث الحالة');
    fetchOrders();
  }

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold text-white">الطلبات والمرتجعات</h1>
          <button onClick={fetchOrders} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600"><RefreshCw size={18} className="text-gray-300" /></button>
        </div>
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : orders.length===0 ? <div className="text-center text-gray-400">لا توجد طلبات</div> :
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700"><tr><th className="p-3 text-right">العميل</th><th className="p-3 text-right">المنتج</th><th className="p-3 text-right">الأصل</th><th className="p-3 text-right">التاريخ</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">إجراء</th></tr></thead>
              <tbody>
                {orders.map(o=>(
                  <tr key={o.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{o.customer_email}</td>
                    <td className="p-3 text-gray-300">{o.products?.name || '-'}</td>
                    <td className="p-3 text-gray-300">{o.assets?.product_id || '-'}</td>
                    <td className="p-3 text-gray-300">{new Date(o.created_at).toLocaleString('ar-SY')}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded-lg text-xs ${o.status==='returned'?'bg-red-600/20 text-red-400':'bg-green-600/20 text-green-400'}`}>{o.status}</span></td>
                    <td className="p-3">{o.status==='returned' && <button onClick={()=>updateReturnStatus(o.id,'completed')} className="text-cyan-400">حل المرتجع</button>}</td>
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