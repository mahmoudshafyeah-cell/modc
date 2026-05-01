'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

export default function ConnectionLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('connection_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) toast.error('فشل جلب سجل الاتصال');
    else setLogs(data || []);
    setLoading(false);
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">سجل اتصال المنصة</h1>
          <button onClick={fetchLogs} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600"><RefreshCw size={18} /></button>
        </div>
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : logs.length === 0 ? <div className="text-center py-20 text-gray-400">لا توجد سجلات</div> : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700"><tr><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">التاريخ</th></tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3"><span className={`inline-block w-3 h-3 rounded-full ml-1 ${l.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span> {l.status === 'connected' ? 'متصل' : 'غير متصل'}</td>
                    <td className="p-3 text-gray-300">{new Date(l.created_at).toLocaleString('ar-SY')}</td>
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