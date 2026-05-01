'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, ExternalLink, Wallet, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  color?: string;
  metadata?: any;
}

interface AgentTopbarProps {
  userData: any;
  isSubAgent?: boolean; // للتمييز بين وكيل عادي ووكيل فرعي
  onNavigateToVip?: () => void; // اختياري: للانتقال إلى تبويب VIP
}

export default function AgentTopbar({ userData, isSubAgent = false, onNavigateToVip }: AgentTopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [totalEarned, setTotalEarned] = useState<number | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  // جلب العدد غير المقروء كل 30 ثانية
  useEffect(() => {
    if (!userData?.id) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userData?.id]);

  // جلب الرصيد والأرباح عند التحميل
  useEffect(() => {
    if (!userData?.id) return;
    fetchBalance();
    fetchTotalEarned();
  }, [userData?.id]);

  // جلب الإشعارات عند الفتح
  useEffect(() => {
    if (notifOpen && userData?.id) {
      fetchNotifications();
    }
  }, [notifOpen, userData?.id]);

  async function fetchUnreadCount() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/notifications?userId=${userData.id}&limit=99`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const notifs = data.notifications || [];
        setUnreadCount(notifs.filter((n: Notification) => !n.read).length);
      }
    } catch {}
  }

  async function fetchBalance() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/wallet?userId=${userData.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance ?? 0);
      } else {
        setBalance(0);
      }
    } catch {
      setBalance(0);
    }
  }

  async function fetchTotalEarned() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && typeof data.monthlyProfit === 'number') {
        setTotalEarned(data.monthlyProfit);
      }
    } catch {}
  }

  async function fetchNotifications() {
    setLoadingNotifs(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/notifications?userId=${userData.id}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const notifs: Notification[] = (data.notifications || []).map((n: any) => ({
          ...n,
          color: n.type === 'success' ? '#00FF94' : n.type === 'warning' ? '#FFB800' : '#00D4FF',
        }));
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      }
    } catch (e) {
      console.error('فشل جلب الإشعارات', e);
    } finally {
      setLoadingNotifs(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }

  async function markAllAsRead() {
    if (notifications.length === 0) return;
    try {
      const token = localStorage.getItem('auth_token');
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      await Promise.all(unreadIds.map(id =>
        fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id }),
        })
      ));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('تم تحديد الكل كمقروء');
    } catch {
      toast.error('فشل تحديث الإشعارات');
    }
  }

  const handleNotificationClick = (n: Notification) => {
    markAsRead(n.id);
    // تحديث الرصيد عند وجود إشعار مالي
    if (n.type === 'success' || n.type === 'warning') {
      fetchBalance();
      fetchTotalEarned();
    }
    if (n.metadata?.action_url) {
      window.location.href = n.metadata.action_url;
    }
    setNotifOpen(false);
  };

  const displayName = userData?.full_name || userData?.email?.split('@')[0] || 'وكيل';
  const userInitial = displayName.charAt(0);
  const accentColor = '#0c71b2'; // لون الوكيل

  const roleLabel = isSubAgent ? 'وكيل فرعي' : 'وكيل معتمد';

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b flex-shrink-0"
      style={{ background: 'rgba(10,10,20,0.95)', borderColor: `${accentColor}20`, backdropFilter: 'blur(10px)' }}>
      
      <div className="flex items-center gap-3">
        {/* زر VIP اختياري (ينتقل إلى تبويب المستوى داخل الصفحة) */}
        {onNavigateToVip && (
          <button
            onClick={onNavigateToVip}
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold transition-all hover:bg-cyan-500/10"
            style={{ background: 'rgba(12, 113, 178, 0.1)', border: '1px solid rgba(12, 113, 178, 0.3)', color: '#00D4FF' }}
          >
            <TrendingUp size={14} />
            <span>مستواي</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* عرض الرصيد الفعلي للمحفظة */}
        {balance !== null && (
          <div className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(0,255,148,0.1)', border: '1px solid rgba(0,255,148,0.2)', color: '#00FF94' }}>
            <Wallet size={14} className="text-green-400" />
            <span>${balance.toFixed(2)}</span>
          </div>
        )}

        {/* عرض إجمالي الأرباح إن وجدت */}
        {totalEarned !== null && (
          <div className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(12, 113, 178, 0.1)', border: '1px solid rgba(12, 113, 178, 0.2)', color: '#00D4FF' }}>
            <TrendingUp size={14} />
            <span>${totalEarned.toFixed(2)}</span>
          </div>
        )}

        {/* الإشعارات */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}
          >
            <Bell size={16} style={{ color: accentColor }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white bg-red-500"
                style={{ fontSize: '10px' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl z-50 animate-slide-up"
              style={{ background: '#111128', border: `1px solid ${accentColor}40`, boxShadow: '0 16px 48px rgba(0,0,0,0.8)' }}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: `${accentColor}20` }}>
                <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-white"><X size={16} /></button>
                <h4 className="text-sm font-bold text-white">الإشعارات</h4>
              </div>
              <div className="divide-y" style={{ divideColor: `${accentColor}10` }}>
                {loadingNotifs ? (
                  <div className="p-4 text-center text-gray-400">جاري التحميل...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">لا توجد إشعارات</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 text-right transition-colors hover:bg-cyan-500/10 cursor-pointer ${!n.read ? 'bg-cyan-500/5' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {!n.read && <div className="w-2 h-2 rounded-full" style={{ background: n.color || accentColor }} />}
                            <p className="text-sm font-semibold text-white">{n.title}</p>
                            {n.metadata?.action_url && <ExternalLink size={12} className="text-cyan-400" />}
                          </div>
                          <p className="text-xs text-gray-300 mt-1">{n.message}</p>
                          {n.metadata?.user_email && (
                            <p className="text-xs text-gray-500 mt-1">
                              المستخدم: {n.metadata.user_email} | المبلغ: ${n.metadata.amount}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {new Date(n.created_at).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 text-center border-t" style={{ borderColor: `${accentColor}10` }}>
                <button onClick={markAllAsRead} className="flex items-center gap-1.5 mx-auto text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-semibold">
                  <CheckCheck size={13} />
                  تحديد الكل كمقروء
                </button>
              </div>
            </div>
          )}
        </div>

        {/* معلومات الوكيل */}
        <Link href="/agent-dashboard"
          className="flex items-center gap-2 px-3 h-9 rounded-xl transition-all duration-200 hover:bg-cyan-500/10"
          style={{ border: `1px solid ${accentColor}30` }}>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white leading-none">{displayName}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: `linear-gradient(135deg, ${accentColor}, #00D4FF)`, color: 'white' }}>
            {userInitial}
          </div>
        </Link>
      </div>
    </header>
  );
}