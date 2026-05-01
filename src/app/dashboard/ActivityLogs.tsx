'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Activity, User, Package, Wallet, Settings, Search } from 'lucide-react';

const actionIcons: Record<string, any> = {
  login: User,
  update_product: Package,
  update_wallet: Wallet,
  update_settings: Settings,
  approve_deposit: Wallet,
  delete_user: User,
  default: Activity,
};

const actionLabels: Record<string, string> = {
  login: 'تسجيل دخول',
  update_product: 'تعديل منتج',
  create_product: 'إضافة منتج',
  delete_product: 'حذف منتج',
  update_wallet: 'تعديل رصيد',
  approve_deposit: 'موافقة إيداع',
  update_settings: 'تعديل إعدادات',
  delete_user: 'حذف مستخدم',
  ban_user: 'حظر مستخدم',
  update_role: 'تغيير دور',
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  async function fetchLogs() {
    try {
      const token = localStorage.getItem('auth_token');
      const url = new URL('/api/admin/activity-logs', window.location.origin);
      url.searchParams.set('limit', '200');
      if (filter !== 'all') url.searchParams.set('action', filter);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setLogs(data.logs || []);
    } catch (error) {
      toast.error('فشل جلب سجل النشاطات');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="h-14 bg-dark-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">سجل النشاطات</h2>
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'login', label: 'دخول' },
            { id: 'update_product', label: 'منتجات' },
            { id: 'update_wallet', label: 'محافظ' },
            { id: 'approve_deposit', label: 'إيداعات' },
            { id: 'update_settings', label: 'إعدادات' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f.id ? 'bg-violet-600 text-white' : 'bg-dark-100 text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-dark-100 border border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-700">
          {logs.length === 0 ? (
            <p className="p-6 text-gray-400 text-center">لا توجد نشاطات</p>
          ) : (
            logs.map(log => {
              const Icon = actionIcons[log.action] || actionIcons.default;
              const color = log.action.includes('delete') ? '#FF4466' :
                           log.action.includes('update') ? '#FFB800' :
                           log.action.includes('create') ? '#00FF94' :
                           '#6C3AFF';
              return (
                <div key={log.id} className="flex items-center justify-between p-4 hover:bg-violet-500/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {actionLabels[log.action] || log.action}
                      </p>
                      {log.entity_type && (
                        <p className="text-xs text-gray-400">
                          {log.entity_type}: {log.entity_id?.slice(0, 8)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString('ar-SY')}
                    </p>
                    <p className="text-xs text-gray-600">{log.user_email}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}