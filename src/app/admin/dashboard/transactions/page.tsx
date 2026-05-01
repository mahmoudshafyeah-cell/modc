'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    setLoading(true);
    const { data, error } = await supabase
      .from('asset_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) toast.error('فشل جلب الحركات');
    else setTransactions(data || []);
    setLoading(false);
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">سجل الحركات (جميع الأنواع)</h1>
          <button onClick={fetchTransactions} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600"><RefreshCw size={18} /></button>
        </div>
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : transactions.length === 0 ? <div className="text-center py-20 text-gray-400">لا توجد حركات</div> : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr><th className="p-3 text-right">الأصل</th><th className="p-3 text-right">من</th><th className="p-3 text-right">إلى</th><th className="p-3 text-right">النوع</th><th className="p-3 text-right">السعر</th><th className="p-3 text-right">التاريخ</th></tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{t.asset_id?.slice(0,8)}</td><td className="p-3 text-gray-300">{t.from_user}</td><td className="p-3 text-gray-300">{t.to_user}</td>
                    <td className="p-3 text-gray-300">{t.type}</td><td className="p-3 text-gray-300">{t.price ? `$${t.price}` : '-'}</td>
                    <td className="p-3 text-gray-300">{new Date(t.created_at).toLocaleString('ar-SY')}</td>
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