'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function StaffTrackingPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [filterUser, setFilterUser] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [filterUser]);

  async function fetchActivities() {
    setLoading(true);
    let query = supabase.from('staff_activity').select('*').order('created_at', { ascending: false }).limit(200);
    if (filterUser) query = query.eq('user_email', filterUser);
    const { data } = await query;
    setActivities(data || []);
    setLoading(false);
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">تتبع أنشطة الموظفين</h1>
          <button onClick={fetchActivities} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600"><RefreshCw size={18} /></button>
        </div>
        <input type="text" placeholder="تصفية بالبريد الإلكتروني" value={filterUser} onChange={e => setFilterUser(e.target.value)} className="w-full md:w-80 p-2 rounded-lg bg-dark-100 border border-gray-700 text-white" />
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : activities.length === 0 ? <div className="text-center py-20 text-gray-400">لا توجد أنشطة</div> : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700"><tr><th className="p-3 text-right">المستخدم</th><th className="p-3 text-right">الإجراء</th><th className="p-3 text-right">التفاصيل</th><th className="p-3 text-right">التاريخ</th></tr></thead>
              <tbody>
                {activities.map(act => (
                  <tr key={act.id} className="border-b border-gray-800"><td className="p-3">{act.user_email}</td><td className="p-3">{act.action}</td><td className="p-3">{act.details}</td><td className="p-3">{new Date(act.created_at).toLocaleString('ar-SY')}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}