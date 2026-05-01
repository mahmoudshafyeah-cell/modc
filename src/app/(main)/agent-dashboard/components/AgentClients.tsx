// المسار: src/app/(main)/agent-dashboard/components/AgentClients.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Users,
  Search,
  UserPlus,
  Copy,
  TrendingUp,
  ShoppingBag,
  Clock,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface SubAgent {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  total_sales: number;
  total_orders: number;
  commission_rate: number;
  joined_at: string;
  status: 'active' | 'inactive';
  referral_code?: string;
}

export default function AgentClients({ userData }: { userData: any }) {
  const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    fetchSubAgents();
    generateInviteLink();
  }, []);

  async function fetchSubAgents() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/sub-agents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setSubAgents(data.subAgents || []);
    } catch (error) {
      console.error('فشل جلب الوكلاء الفرعيين:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateInviteLink() {
    if (!userData?.id) return;
    const link = `${window.location.origin}/sign-up-login-screen?ref=${userData.id}&type=agent`;
    setInviteLink(link);
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      toast.error('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    setInviteLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/invite-sub-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال الدعوة');
      toast.success('تم إرسال الدعوة بنجاح');
      setInviteOpen(false);
      setInviteEmail('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setInviteLoading(false);
    }
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('تم نسخ رابط الدعوة');
  };

  const filtered = subAgents.filter(
    a =>
      !search ||
      a.full_name?.includes(search) ||
      a.email?.includes(search) ||
      a.phone?.includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ========== رأس الصفحة ========== */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(12, 113, 178, 0.15)', border: '1px solid rgba(12, 113, 178, 0.3)' }}
          >
            <Users size={24} style={{ color: '#0c71b2' }} />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-white">عملائي</h1>
            <p className="text-sm text-gray-400">الوكلاء الفرعيين المنضمين إلى وكالتك</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #0c71b2, #00D4FF)' }}
          >
            <UserPlus size={16} />
            دعوة وكيل فرعي
          </button>
          <button
            onClick={copyInviteLink}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'rgba(12, 113, 178, 0.1)',
              border: '1px solid rgba(12, 113, 178, 0.3)',
              color: '#0c71b2',
            }}
          >
            <Copy size={16} />
            نسخ رابط الدعوة
          </button>
        </div>
      </div>

      {/* ========== شريط البحث ========== */}
      <div className="relative w-full md:w-72">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث عن وكيل..."
          className="input-field pr-9 text-right text-sm h-10 w-full"
        />
      </div>

      {/* ========== إحصائيات سريعة ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي الوكلاء', value: subAgents.length, icon: Users, color: '#0c71b2' },
          {
            label: 'النشطون',
            value: subAgents.filter(a => a.status === 'active').length,
            icon: CheckCircle,
            color: '#00FF94',
          },
          {
            label: 'إجمالي مبيعاتهم',
            value: `$${subAgents.reduce((s, a) => s + a.total_sales, 0).toFixed(2)}`,
            icon: ShoppingBag,
            color: '#FFB800',
          },
          {
            label: 'عمولاتك',
            value: `$${(subAgents.reduce((s, a) => s + a.total_sales * a.commission_rate, 0) / 100).toFixed(2)}`,
            icon: TrendingUp,
            color: '#00D4FF',
          },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-xl p-4 text-right"
            style={{ background: `${stat.color}10`, border: `1px solid ${stat.color}20` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-black text-white">{stat.value}</span>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ========== جدول الوكلاء ========== */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#111128', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-4 text-gray-400 text-sm">الوكيل</th>
                <th className="p-4 text-gray-400 text-sm">المبيعات</th>
                <th className="p-4 text-gray-400 text-sm">الطلبات</th>
                <th className="p-4 text-gray-400 text-sm">العمولة</th>
                <th className="p-4 text-gray-400 text-sm">تاريخ الانضمام</th>
                <th className="p-4 text-gray-400 text-sm">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    <Users size={48} className="mx-auto mb-3 text-gray-600" />
                    <p className="text-lg font-bold text-white mb-1">لا يوجد وكلاء فرعيون بعد</p>
                    <p className="text-sm">ادعُ وكلاء جدد للانضمام إلى وكالتك</p>
                  </td>
                </tr>
              ) : (
                filtered.map(agent => (
                  <tr key={agent.id} className="border-b border-gray-800 hover:bg-violet-500/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{
                            background: 'linear-gradient(135deg, #0c71b2, #00D4FF)',
                            color: 'white',
                          }}
                        >
                          {agent.full_name?.charAt(0) || 'و'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{agent.full_name || '—'}</p>
                          <p className="text-gray-500 text-xs" dir="ltr">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white font-bold">${agent.total_sales.toFixed(2)}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white">{agent.total_orders}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-cyan-400 font-bold">{agent.commission_rate}%</span>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(agent.joined_at).toLocaleDateString('ar-SY')}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          agent.status === 'active'
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-red-600/20 text-red-400'
                        }`}
                      >
                        {agent.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== نافذة الدعوة ========== */}
      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setInviteOpen(false)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-md border"
            style={{ background: '#111128', borderColor: 'rgba(12, 113, 178, 0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setInviteOpen(false)} className="text-gray-400 hover:text-white">
                <XCircle size={20} />
              </button>
              <h3 className="text-lg font-bold text-white">دعوة وكيل فرعي</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">البريد الإلكتروني للوكيل</label>
                <div className="relative">
                  <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="agent@example.com"
                    className="input-field pr-10 text-right w-full"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'rgba(12, 113, 178, 0.1)', border: '1px solid rgba(12, 113, 178, 0.2)' }}>
                <p className="text-sm text-gray-300 mb-2">أو شارك رابط الدعوة:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 p-2 rounded-lg bg-dark-50 border border-gray-700 text-gray-300 text-xs"
                    dir="ltr"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleInvite}
                  disabled={inviteLoading}
                  className="flex-1 py-3 rounded-xl font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #0c71b2, #00D4FF)' }}
                >
                  {inviteLoading ? 'جاري الإرسال...' : 'إرسال الدعوة'}
                </button>
                <button
                  onClick={() => setInviteOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-bold"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}