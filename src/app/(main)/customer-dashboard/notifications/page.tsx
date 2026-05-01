'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;
      const res = await fetch(`/api/notifications?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب الإشعارات');
      setNotifications(data.notifications || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-2xl font-bold text-white mb-6">الإشعارات</h1>
      {notifications.length === 0 ? (
        <p className="text-gray-400 text-center py-8">لا توجد إشعارات</p>
      ) : (
        notifications.map((n) => (
          <div key={n.id} className="p-4 rounded-xl bg-dark-100 border border-gray-700">
            <h3 className="text-white font-bold">{n.title}</h3>
            <p className="text-gray-400 mt-1">{n.message}</p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(n.created_at).toLocaleString('ar-SY')}
            </p>
          </div>
        ))
      )}
    </div>
  );
}