'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Bell, Send } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => { fetchNotifications(); }, []);

  async function fetchNotifications() {
    setLoading(true);
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
    setNotifications(data || []);
    setLoading(false);
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    fetchNotifications();
  }

  async function sendNotification(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !newMessage) return toast.error('العنوان والرسالة مطلوبان');
    const { error } = await supabase.from('notifications').insert({
      title: newTitle,
      message: newMessage,
      type: 'info',
      read: false,
      created_at: new Date().toISOString(),
    });
    if (error) toast.error('فشل الإرسال: '+error.message);
    else { toast.success('تم إرسال الإشعار'); setNewTitle(''); setNewMessage(''); fetchNotifications(); }
  }

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold text-white">الإشعارات</h1>
          <button onClick={fetchNotifications} className="p-2 rounded bg-gray-700"><RefreshCw size={18} /></button>
        </div>

        <form onSubmit={sendNotification} className="bg-dark-100 p-5 rounded-xl border border-gray-800 space-y-3">
          <input type="text" placeholder="عنوان الإشعار" value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
          <textarea placeholder="نص الإشعار" rows={3} value={newMessage} onChange={e=>setNewMessage(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
          <button type="submit" className="px-4 py-2 rounded bg-cyan-600 text-white font-bold flex items-center gap-2"><Send size={16} /> إرسال إشعار</button>
        </form>

        {loading ? <div className="flex justify-center py-10"><div className="w-8 h-8 animate-spin" /></div> : notifications.length===0 ? <div className="text-center text-gray-400">لا توجد إشعارات</div> :
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} className={`bg-dark-100 rounded-xl p-4 border ${n.read ? 'border-gray-800' : 'border-cyan-500/50'} cursor-pointer`} onClick={() => !n.read && markAsRead(n.id)}>
                <div className="flex justify-between items-start">
                  <div><h3 className="font-bold text-white">{n.title}</h3><p className="text-gray-300 text-sm mt-1">{n.message}</p></div>
                  <span className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString('ar-SY')}</span>
                </div>
                {!n.read && <div className="text-xs text-cyan-400 mt-2">جديد</div>}
              </div>
            ))}
          </div>
        }
      </div>
    </AuthGuard>
  );
}