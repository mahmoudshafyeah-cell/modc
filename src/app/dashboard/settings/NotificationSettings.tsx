'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function NotificationSettings() {
  const [emailNotifs, setEmailNotifs] = useState({
    password_change: true,
    deposit: true,
    withdrawal: true,
    purchase: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const data = await res.json();
      if (res.ok && data.settings.email_notifications) {
        setEmailNotifs(data.settings.email_notifications);
      }
    } catch (error) {
      toast.error('فشل جلب الإعدادات');
    } finally {
      setLoading(false);
    }
  }

  async function updateEmailNotifs(newSettings: typeof emailNotifs) {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ key: 'email_notifications', value: newSettings }),
      });
      if (!res.ok) throw new Error('فشل التحديث');
      toast.success('تم تحديث الإعدادات');
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const toggle = (key: keyof typeof emailNotifs) => {
    const updated = { ...emailNotifs, [key]: !emailNotifs[key] };
    setEmailNotifs(updated);
    updateEmailNotifs(updated);
  };

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="max-w-2xl">
      <div className="bg-dark-100 p-6 rounded-xl border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">إشعارات البريد الإلكتروني</h3>
        <div className="space-y-4">
          {Object.entries({
            password_change: 'تغيير كلمة المرور',
            deposit: 'إيداع',
            withdrawal: 'سحب',
            purchase: 'شراء',
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-white">{label}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifs[key as keyof typeof emailNotifs]}
                  onChange={() => toggle(key as keyof typeof emailNotifs)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-violet-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}