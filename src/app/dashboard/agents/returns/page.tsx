'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

interface ReturnOrder {
  id: string;
  customer_email: string;
  product_name: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function AgentReturnsPage() {
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturns();
  }, []);

  async function fetchReturns() {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .eq('agent_email', user.data.user?.email)
      .order('created_at', { ascending: false });
    if (error) toast.error('فشل جلب المرتجعات');
    else setReturns(data || []);
    setLoading(false);
  }

  async function resolveReturn(id: string) {
    const { error } = await supabase
      .from('returns')
      .update({ status: 'resolved' })
      .eq('id', id);
    if (error) toast.error('فشل حل المرتجع');
    else {
      toast.success('تم حل المرتجع');
      fetchReturns();
    }
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">المرتجعات</h1>
          <button onClick={fetchReturns} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600"><RefreshCw size={18} /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div>
        ) : returns.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد مرتجعات</div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr><th className="p-3 text-right">العميل</th><th className="p-3 text-right">المنتج</th><th className="p-3 text-right">السبب</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">إجراء</th></tr>
              </thead>
              <tbody>
                {returns.map(r => (
                  <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{r.customer_email}</td>
                    <td className="p-3 text-gray-300">{r.product_name}</td>
                    <td className="p-3 text-gray-300">{r.reason}</td>
                    <td className="p-3">{r.status === 'pending' ? 'معلق' : 'تم الحل'}</td>
                    <td className="p-3">
                      {r.status === 'pending' && (
                        <button onClick={() => resolveReturn(r.id)} className="text-green-400"><CheckCircle size={18} /></button>
                      )}
                    </td>
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