'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('فشل جلب الإشعارات');
    else setNotifications(data || []);
    setLoading(false);
  }

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (error) toast.error('فشل التحديث');
    else {
      toast.success('تم تحديد كمقروء');
      fetchNotifications();
    }
  }

  async function deleteNotification(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    if (error) toast.error('فشل الحذف');
    else {
      toast.success('تم الحذف');
      fetchNotifications();
    }
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">الإشعارات</h1>
          <button onClick={fetchNotifications} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600"><RefreshCw size={18} /></button>
        </div>
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : notifications.length === 0 ? <div className="text-center py-20 text-gray-400">لا توجد إشعارات</div> : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id} className={`bg-dark-100 rounded-xl p-4 border ${n.read ? 'border-gray-700' : 'border-cyan-500/50 bg-cyan-600/5'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-bold">{n.title}</h3>
                    <p className="text-gray-300 text-sm mt-1">{n.message}</p>
                    <p className="text-gray-500 text-xs mt-2">المستخدم: {n.user_id || 'الكل'} | {new Date(n.created_at).toLocaleString('ar-SY')}</p>
                  </div>
                  <div className="flex gap-2">
                    {!n.read && <button onClick={() => markAsRead(n.id)} title="تحديد كمقروء" className="text-cyan-400"><Eye size={16} /></button>}
                    <button onClick={() => deleteNotification(n.id)} className="text-red-400"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}