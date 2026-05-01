// src/app/(main)/customer-dashboard/wallet/page.tsx
'use client';
import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WalletCard, { WalletCardRef } from '../components/WalletCard';
import Link from 'next/link';
import { ArrowRight, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, ShoppingBag } from 'lucide-react';

const txConfig: Record<string, { icon: JSX.Element; color: string }> = {
  deposit: { icon: <ArrowDownCircle size={14} />, color: '#00FF94' },
  withdrawal: { icon: <ArrowUpCircle size={14} />, color: '#FF4466' },
  transfer: { icon: <ArrowLeftRight size={14} />, color: '#FFB800' },
  purchase: { icon: <ShoppingBag size={14} />, color: '#6C3AFF' },
  admin_deposit: { icon: <ArrowDownCircle size={14} />, color: '#00FF94' },
  admin_withdrawal: { icon: <ArrowUpCircle size={14} />, color: '#FF4466' },
};

export default function WalletPage() {
  const router = useRouter();
  const walletRef = useRef<WalletCardRef>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.push('/sign-up-login-screen'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.id);
      fetchRecentData(payload.id);
    } catch { router.push('/sign-up-login-screen'); }
  }, [router]);

  async function fetchRecentData(uid: string) {
    try {
      const token = localStorage.getItem('auth_token');
      const [txRes, ordersRes] = await Promise.all([
        fetch(`/api/transactions?userId=${uid}&limit=5`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/orders?userId=${uid}&limit=5`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const txData = await txRes.json();
      const ordersData = await ordersRes.json();
      if (txRes.ok) setRecentTransactions(txData.transactions || []);
      if (ordersRes.ok) setRecentOrders(ordersData.orders || []);
    } catch (error) {
      console.error('فشل جلب البيانات', error);
    } finally {
      setLoadingTx(false);
    }
  }

  if (!userId) return <div className="flex items-center justify-center h-screen bg-dark-50"><div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/customer-dashboard" className="text-gray-400 hover:text-white transition-colors">
          <ArrowRight size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">محفظتي</h1>
      </div>

      <WalletCard ref={walletRef} userId={userId} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        {/* آخر المعاملات */}
        <div className="rounded-2xl p-5" style={{ background: '#111128', border: '1px solid rgba(108,58,255,0.15)' }}>
          <h3 className="text-sm font-bold text-white mb-4">آخر المعاملات</h3>
          {loadingTx ? (
            <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>
          ) : recentTransactions.length === 0 ? (
            <p className="text-gray-400 text-sm">لا توجد معاملات</p>
          ) : (
            recentTransactions.map(tx => {
              const cfg = txConfig[tx.type] || { icon: null, color: '#6B7280' };
              const sign = tx.direction === 'in' ? '+' : '-';
              const color = tx.direction === 'in' ? 'text-green-400' : 'text-red-400';
              return (
                <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-gray-700 last:border-0">
                  <div className="flex items-center gap-2">
                    <span style={{ color: cfg.color }}>{cfg.icon}</span>
                    <div>
                      <p className="text-sm text-white">{tx.description || tx.type}</p>
                      <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString('ar-SY')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${color}`}>{sign}${tx.amount.toFixed(2)}</span>
                </div>
              );
            })
          )}
        </div>

        {/* آخر الطلبات */}
        <div className="rounded-2xl p-5" style={{ background: '#111128', border: '1px solid rgba(108,58,255,0.15)' }}>
          <h3 className="text-sm font-bold text-white mb-4">آخر الطلبات</h3>
          {loadingTx ? (
            <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>
          ) : recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm">لا توجد طلبات</p>
          ) : (
            recentOrders.map(order => (
              <div key={order.id} className="flex justify-between py-2.5 border-b border-gray-700 last:border-0">
                <div>
                  <p className="text-white text-sm">{order.product_name || order.code || 'طلب'}</p>
                  <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString('ar-SY')}</p>
                </div>
                <span className="text-white font-bold">${order.amount}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}