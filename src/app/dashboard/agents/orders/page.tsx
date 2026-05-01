'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Eye } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

interface Order {
  id: string;
  customer_email: string;
  product_name: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function AgentOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('agent_email', user.data.user?.email)
      .order('created_at', { ascending: false });
    if (error) toast.error('فشل جلب الطلبات');
    else setOrders(data || []);
    setLoading(false);
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">طلباتي (كوكيل)</h1>
          <button onClick={fetchOrders} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600"><RefreshCw size={18} /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد طلبات</div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr><th className="p-3 text-right">العميل</th><th className="p-3 text-right">المنتج</th><th className="p-3 text-right">المبلغ</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">التاريخ</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{o.customer_email}</td>
                    <td className="p-3 text-gray-300">{o.product_name}</td>
                    <td className="p-3 text-gray-300">${o.amount.toFixed(2)}</td>
                    <td className="p-3"><span className="px-2 py-1 rounded-lg text-xs bg-yellow-600/20 text-yellow-400">{o.status}</span></td>
                    <td className="p-3 text-gray-300">{new Date(o.created_at).toLocaleDateString('ar-SY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}