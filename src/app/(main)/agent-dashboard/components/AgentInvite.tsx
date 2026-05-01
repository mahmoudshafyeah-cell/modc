// المسار: src/app/(main)/agent-dashboard/components/AgentInvite.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  UserPlus,
  Copy,
  Mail,
  Send,
  Link as LinkIcon,
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
} from 'lucide-react';

interface InviteRecord {
  id: string;
  email: string;
  status: 'pending' | 'joined' | 'expired';
  created_at: string;
  joined_at?: string;
  promo_code?: string;
}

export default function AgentInvite({ userData }: { userData: any }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateInviteLink();
    fetchInvites();
  }, [userData]);

  // ======================== توليد رابط الدعوة ========================
  function generateInviteLink() {
    if (!userData?.id) return;
    const code = `AGT-${userData.id.slice(0, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const link = `${window.location.origin}/sign-up-login-screen?ref=${userData.id}&code=${code}&type=sub-agent`;
    setInviteLink(link);
    setPromoCode(code);
  }

  // ======================== جلب الدعوات السابقة ========================
  async function fetchInvites() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/invites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setInvites(data.invites || []);
    } catch (error) {
      console.error('فشل جلب الدعوات:', error);
    } finally {
      setLoading(false);
    }
  }

  // ======================== نسخ الرابط ========================
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('تم نسخ رابط الدعوة');
  };

  // ======================== نسخ كود البرومو ========================
  const copyPromoCode = () => {
    navigator.clipboard.writeText(promoCode);
    toast.success('تم نسخ كود الدعوة');
  };

  // ======================== إرسال دعوة ========================
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
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
        body: JSON.stringify({
          email: inviteEmail,
          promo_code: promoCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال الدعوة');

      toast.success('تم إرسال الدعوة بنجاح');
      setInviteEmail('');
      setInvites(prev => [
        {
          id: data.id || `temp-${Date.now()}`,
          email: inviteEmail,
          status: 'pending',
          created_at: new Date().toISOString(),
          promo_code: promoCode,
        },
        ...prev,
      ]);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setInviteLoading(false);
    }
  }

  // ======================== حالات الدعوة ========================
  const statusLabels: Record<string, string> = {
    pending: 'في الانتظار',
    joined: 'تم الانضمام',
    expired: 'منتهية',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock size={14} className="text-yellow-400" />,
    joined: <CheckCircle size={14} className="text-green-400" />,
    expired: <XCircle size={14} className="text-red-400" />,
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
    joined: 'bg-green-600/20 text-green-400 border-green-500/30',
    expired: 'bg-red-600/20 text-red-400 border-red-500/30',
  };

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
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(12, 113, 178, 0.15)', border: '1px solid rgba(12, 113, 178, 0.3)' }}
        >
          <UserPlus size={24} style={{ color: '#0c71b2' }} />
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-black text-white">دعوة وكيل فرعي</h1>
          <p className="text-sm text-gray-400">ادعُ وكلاء جدد للانضمام إلى وكالتك وكسب عمولات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========== نموذج الدعوة ========== */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#111128', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Send size={20} style={{ color: '#0c71b2' }} />
            إرسال دعوة
          </h2>

          <form onSubmit={handleInvite} className="space-y-4">
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

            <button
              type="submit"
              disabled={inviteLoading}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #0c71b2, #00D4FF)',
                boxShadow: '0 4px 20px rgba(12, 113, 178, 0.3)',
              }}
            >
              {inviteLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send size={18} />
                  إرسال الدعوة
                </>
              )}
            </button>
          </form>

          <div className="border-t mt-6 pt-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <LinkIcon size={16} style={{ color: '#0c71b2' }} />
              رابط الدعوة
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 p-2.5 rounded-lg bg-dark-50 border border-gray-700 text-gray-300 text-xs"
                dir="ltr"
              />
              <button
                onClick={copyInviteLink}
                className="p-2.5 rounded-lg transition-all hover:scale-105"
                style={{ background: 'rgba(12, 113, 178, 0.2)', color: '#0c71b2' }}
              >
                <Copy size={16} />
              </button>
            </div>

            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Ticket size={16} style={{ color: '#00FF94' }} />
              كود البرومو
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={promoCode}
                readOnly
                className="flex-1 p-2.5 rounded-lg bg-dark-50 border border-gray-700 text-white text-sm font-mono text-center"
              />
              <button
                onClick={copyPromoCode}
                className="p-2.5 rounded-lg transition-all hover:scale-105"
                style={{ background: 'rgba(0, 255, 148, 0.2)', color: '#00FF94' }}
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ========== كيفية عمل الدعوات ========== */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#111128', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Users size={20} style={{ color: '#0c71b2' }} />
            كيف تعمل الدعوات؟
          </h2>

          <div className="space-y-4">
            {[
              {
                step: '1',
                icon: <LinkIcon size={20} className="text-cyan-400" />,
                title: 'شارك رابط الدعوة',
                desc: 'انسخ رابط الدعوة أو كود البرومو وشاركه مع الوكلاء الجدد.',
              },
              {
                step: '2',
                icon: <UserPlus size={20} className="text-green-400" />,
                title: 'انضمام الوكيل',
                desc: 'عند تسجيل وكيل جديد باستخدام رابطك أو كودك، ينضم تلقائياً إلى وكالتك.',
              },
              {
                step: '3',
                icon: <CheckCircle size={20} className="text-amber-400" />,
                title: 'اكسب عمولات',
                desc: 'ستحصل على نسبة % من كل عملية إيداع يقوم بها الوكلاء الفرعيون التابعون لك.',
              },
            ].map(item => (
              <div
                key={item.step}
                className="flex items-start gap-4 p-3 rounded-xl"
                style={{ background: 'rgba(12, 113, 178, 0.05)' }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(12, 113, 178, 0.15)' }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{item.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========== سجل الدعوات ========== */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#111128', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-lg font-bold text-white">سجل الدعوات</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-4 text-gray-400 text-sm">البريد الإلكتروني</th>
                <th className="p-4 text-gray-400 text-sm">كود البرومو</th>
                <th className="p-4 text-gray-400 text-sm">تاريخ الدعوة</th>
                <th className="p-4 text-gray-400 text-sm">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    <Send size={48} className="mx-auto mb-3 text-gray-600" />
                    <p className="text-lg font-bold text-white mb-1">لا توجد دعوات بعد</p>
                    <p className="text-sm">ابدأ بدعوة وكلاء جدد للانضمام إلى وكالتك</p>
                  </td>
                </tr>
              ) : (
                invites.map(invite => (
                  <tr
                    key={invite.id}
                    className="border-b border-gray-800 hover:bg-cyan-500/5 transition-colors"
                  >
                    <td className="p-4">
                      <span className="text-white text-sm" dir="ltr">
                        {invite.email}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-cyan-400 font-mono text-sm">
                        {invite.promo_code || '—'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(invite.created_at).toLocaleDateString('ar-SY')}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border ${
                          statusColors[invite.status]
                        }`}
                      >
                        {statusIcons[invite.status]}
                        {statusLabels[invite.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}