'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SendNotificationPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'selected'>('all');
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const token = localStorage.getItem('auth_token');
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setUsers(data.users || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('العنوان والرسالة مطلوبان');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          message,
          targetType,
          userIds: targetType === 'selected' ? selectedUserIds : null,
          sendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`تم الإرسال إلى ${data.count} مستخدم`);
      router.push('/dashboard/notifications');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-white mb-6">إرسال إشعار جماعي</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-white block mb-2">نوع المستلمين</label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as any)}
            className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
          >
            <option value="all">جميع المستخدمين</option>
            <option value="selected">مستخدمين محددين</option>
          </select>
        </div>

        {targetType === 'selected' && (
          <div>
            <label className="text-white block mb-2">اختر المستخدمين</label>
            <select
              multiple
              value={selectedUserIds}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, (opt) => opt.value);
                setSelectedUserIds(options);
              }}
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white min-h-[150px]"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email} ({user.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">اضغط Ctrl (أو Cmd) لاختيار عدة مستخدمين</p>
          </div>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان الإشعار"
          className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
          required
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="نص الإشعار"
          rows={4}
          className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
          required
        />
        <label className="flex items-center gap-2 text-white">
          <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
          إرسال عبر البريد الإلكتروني أيضاً
        </label>
        <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold">
          {loading ? 'جاري الإرسال...' : 'إرسال'}
        </button>
      </form>
    </div>
  );
}