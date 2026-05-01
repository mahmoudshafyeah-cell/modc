'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filterUser, filterAction]);

  async function fetchLogs() {
    setLoading(true);
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (filterUser) query = query.eq('user_email', filterUser);
    if (filterAction) query = query.eq('action', filterAction);
    const { data, error } = await query;
    if (error) toast.error('فشل جلب السجل');
    else setLogs(data || []);
    setLoading(false);
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">سجل التدقيق</h1>
          <button onClick={fetchLogs} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600"><RefreshCw size={18} /></button>
        </div>
        <div className="flex gap-4 flex-wrap">
          <input type="text" placeholder="بريد المستخدم" value={filterUser} onChange={e => setFilterUser(e.target.value)} className="p-2 rounded-lg bg-dark-100 border border-gray-700 text-white w-64" />
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="p-2 rounded-lg bg-dark-100 border border-gray-700 text-white">
            <option value="">كل الإجراءات</option><option value="add_asset">إضافة أصل</option><option value="edit_asset">تعديل أصل</option><option value="delete_asset">حذف أصل</option><option value="import_assets">رفع ملف</option><option value="change_role">تغيير صلاحية</option>
          </select>
        </div>
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : logs.length === 0 ? <div className="text-center py-20 text-gray-400">لا توجد سجلات</div> : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700"><tr><th className="p-3 text-right">المستخدم</th><th className="p-3 text-right">الإجراء</th><th className="p-3 text-right">النوع</th><th className="p-3 text-right">التفاصيل</th><th className="p-3 text-right">التاريخ</th></tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{l.user_email}</td><td className="p-3 text-gray-300">{l.action}</td><td className="p-3 text-gray-300">{l.entity_type}</td>
                    <td className="p-3 text-gray-300 max-w-xs truncate">{l.details}</td><td className="p-3 text-gray-300">{new Date(l.created_at).toLocaleString('ar-SY')}</td>
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