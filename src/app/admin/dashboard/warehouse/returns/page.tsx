'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReturns(); }, []);

  async function fetchReturns() {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, assets(product_id), products(name)')
      .eq('status', 'returned')
      .order('created_at', { ascending: false });
    setReturns(data || []);
    setLoading(false);
  }

  async function resolveReturn(orderId: string, assetId: string) {
    // تحديث حالة الطلب إلى مكتمل (أو أي إجراء آخر)
    await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId);
    // إعادة الأصل إلى حالة متاحة
    await supabase.from('assets').update({ status: 'available', owner_id: 'system' }).eq('id', assetId);
    toast.success('تمت معالجة المرتجع وإعادة الأصل إلى المخزون');
    fetchReturns();
  }

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold text-white">المرتجعات</h1>
          <button onClick={fetchReturns} className="p-2 rounded bg-gray-700"><RefreshCw size={18} /></button>
        </div>
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : returns.length===0 ? <div className="text-center text-gray-400">لا توجد مرتجعات</div> :
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700"><tr>
                <th className="p-3 text-right">العميل</th><th className="p-3 text-right">المنتج</th><th className="p-3 text-right">الأصل</th>
                <th className="p-3 text-right">تاريخ الطلب</th><th className="p-3 text-right">إجراء</th>
              </tr></thead>
              <tbody>
                {returns.map(r => (
                  <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{r.customer_email}</td>
                    <td className="p-3 text-gray-300">{r.products?.name || '-'}</td>
                    <td className="p-3 text-gray-300">{r.assets?.product_id || '-'}</td>
                    <td className="p-3 text-gray-300">{new Date(r.created_at).toLocaleString('ar-SY')}</td>
                    <td className="p-3">
                      <button onClick={() => resolveReturn(r.id, r.asset_id)} className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"><CheckCircle size={16} /> حل المرتجع</button>
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