'use client';
import React, { useState, useEffect, useRef } from 'react';
import WalletCard, { WalletCardRef } from './components/WalletCard';
import DashboardStats from './components/DashboardStats';
import OrdersTable from './components/OrdersTable';
import TransactionFeed from './components/TransactionFeed';
import WalletChart from './components/WalletChart';
import QuickBuySection from './components/QuickBuySection';
import { WalletModalProvider } from './components/WalletModalProvider';
import { jwtDecode } from 'jwt-decode';

interface UserData {
  id: string;
  email: string;
  role: string;
  full_name?: string;
}

export default function CustomerDashboardContent() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const walletRef = useRef<WalletCardRef>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded = jwtDecode<UserData>(token);
        setUserData(decoded);
      } catch (error) {
        console.error('فشل فك تشفير التوكن:', error);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userData?.id) fetchBalance();
  }, [userData]);

  async function fetchBalance() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/wallet?userId=${userData?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setBalance(data.balance || 0);
    } catch {}
  }

  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = userData.full_name || userData.email?.split('@')[0] || 'مستخدم';
  const today = new Date().toLocaleDateString('ar-SY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <WalletModalProvider userId={userData.id} currentBalance={balance} onBalanceUpdate={fetchBalance}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.2)',
              color: '#00D4FF',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>آخر تحديث: الآن</span>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-white">مرحباً، {displayName} 👋</h1>
            <p className="text-sm text-gray-400">{today}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <WalletCard ref={walletRef} userId={userData.id} />
          </div>
          <div className="xl:col-span-1">
            <QuickBuySection />
          </div>
        </div>

        <DashboardStats userId={userData.id} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <WalletChart />
          </div>
          <div className="xl:col-span-1">
            <TransactionFeed userId={userData.id} />
          </div>
        </div>

        <OrdersTable userId={userData.id} />
      </div>
    </WalletModalProvider>
  );
}