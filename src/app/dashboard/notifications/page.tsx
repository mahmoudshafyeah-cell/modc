// src/app/dashboard/notifications/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import jwt from 'jsonwebtoken';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const token = localStorage.getItem('auth_token');
      const decoded = jwt.decode(token!) as any;
      const res = await fetch(`/api/notifications?userId=${decoded.id}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotifications(data.notifications || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold text-white mb-6">جميع الإشعارات</h1>
      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className={`p-4 rounded-xl bg-dark-100 border ${n.read ? 'border-gray-700' : 'border-violet-500/30'}`}>
            <div className="flex justify-between">
              <h3 className="font-bold text-white">{n.title}</h3>
              <span className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString('ar')}</span>
            </div>
            <p className="text-gray-300 mt-2">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}