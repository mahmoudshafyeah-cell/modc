// src/app/dashboard/notifications/NotificationsList.tsx
'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const res = await fetch(`/api/notifications?userId=${payload.id}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setNotifications(data.notifications || []);
    } catch {}
  };

  useEffect(() => {
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 30000); // كل 30 ثانية
    return () => clearInterval(timer);
  }, []);

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-4" dir="rtl">
      <h2 className="text-xl font-bold text-white mb-4">الإشعارات</h2>
      {notifications.length === 0 ? <p className="text-gray-400">لا توجد إشعارات</p> : notifications.map(n => (
        <div key={n.id} className={`p-4 rounded-xl bg-dark-100 border ${n.read ? 'border-gray-700' : 'border-violet-500/30 bg-violet-600/5'} cursor-pointer`}
          onClick={() => {
            if (n.metadata?.action_url) window.location.href = n.metadata.action_url;
          }}>
          <div className="flex justify-between">
            <h3 className="font-bold text-white">{n.title}</h3>
            {n.metadata?.action_url && <ExternalLink size={14} className="text-cyan-400" />}
          </div>
          <p className="text-gray-300 text-sm mt-1">{n.message}</p>
          <p className="text-xs text-gray-500 mt-2">{new Date(n.created_at).toLocaleString('ar-SY')}</p>
        </div>
      ))}
    </div>
  );
}