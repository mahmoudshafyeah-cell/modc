'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import AgentSidebar from './components/AgentSidebar';
import AgentTopbar from './components/AgentTopbar';
import AgentProducts from './components/AgentProducts';
import AgentClients from './components/AgentClients';
import AgentPayments from './components/AgentPayments';
import AgentOrders from './components/AgentOrders';
import AgentSecurity from './components/AgentSecurity';
import AgentInvite from './components/AgentInvite';
import AgentVipStatus from './components/AgentVipStatus';
import AgentCredit from './components/AgentCredit';
import BuyBalanceModal from './components/BuyBalanceModal';
import {
  Home, Users, PlusCircle, FileText, Wallet, Package,
  Shield, UserPlus, Crown, CreditCard,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  balance?: number;
  total_earned?: number;
  agent_code?: string;
  avatar_url?: string | null;
}

type AgentTab =
  | 'home'
  | 'clients'
  | 'deposit'
  | 'payments'
  | 'wallet'
  | 'orders'
  | 'security'
  | 'invite'
  | 'vip'
  | 'credit';

const agentTabs: { id: AgentTab; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'home', label: 'الرئيسية', icon: Home, color: '#0c71b2' },
  { id: 'clients', label: 'عملائي', icon: Users, color: '#00D4FF' },
  { id: 'deposit', label: 'اضافة رصيد', icon: PlusCircle, color: '#00FF94' },
  { id: 'payments', label: 'دفعاتي', icon: FileText, color: '#FFB800' },
  { id: 'wallet', label: 'محفظتي', icon: Wallet, color: '#6C3AFF' },
  { id: 'orders', label: 'طلباتي', icon: Package, color: '#9B6BFF' },
  { id: 'security', label: 'الحماية', icon: Shield, color: '#FF4466' },
  { id: 'vip', label: 'مستواي', icon: Crown, color: '#FFB800' },
  { id: 'credit', label: 'المديونية', icon: CreditCard, color: '#FF4466' },
  { id: 'invite', label: 'دعوة وكيل فرعي', icon: UserPlus, color: '#00FF94' },
];

export default function AgentDashboardContent() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AgentTab>('home');
  const [depositOpen, setDepositOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSubAgent, setIsSubAgent] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded = jwtDecode<UserData>(token);
        setUserData(decoded);
        fetchFullProfile(decoded.id, token);
        checkIfSubAgent(decoded.id, token);
      } catch (e) { console.error(e); }
    }
    setLoading(false);
  }, [refreshKey]);

  async function fetchFullProfile(userId: string, token: string) {
    try {
      const [walletRes, statsRes] = await Promise.all([
        fetch(`/api/wallet?userId=${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/agent/stats', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const walletData = await walletRes.json();
      const statsData = await statsRes.json();
      setUserData(prev => prev ? { ...prev, balance: walletData.balance ?? 0, total_earned: statsData.monthlyProfit ?? 0, avatar_url: walletData.avatar_url || null, agent_code: `AGT-${userId.slice(0, 8).toUpperCase()}` } : prev);
    } catch (e) { }
  }

  async function checkIfSubAgent(userId: string, token: string) {
    try {
      const res = await fetch(`/api/agent/is-sub-agent?userId=${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setIsSubAgent(data.isSubAgent);
    } catch (e) { }
  }

  const displayName = userData?.full_name || userData?.email?.split('@')[0] || 'وكيل';

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>;
  if (!userData) return <div className="flex items-center justify-center h-screen"><p className="text-red-400">تعذر تحميل البيانات</p></div>;
console.log('AgentDashboardContent rendering, userData:', userData, 'loading:', loading);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0A0A14' }} dir="rtl">
      <AgentSidebar
        userData={userData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDeposit={() => setDepositOpen(true)}
        isSubAgent={isSubAgent}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AgentTopbar userData={userData} onNavigateToVip={() => setActiveTab('vip')} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-right mb-6">
            <h1 className="text-2xl font-black text-white">مرحباً، {displayName} 👋</h1>
            <p className="text-sm text-gray-400">{new Date().toLocaleDateString('ar-SY', { weekday: 'long' })}</p>
          </div>
          {activeTab === 'home' && <AgentProducts userData={userData} />}
          {activeTab === 'clients' && <AgentClients userData={userData} />}
          {activeTab === 'payments' && <AgentPayments userData={userData} />}
          {activeTab === 'orders' && <AgentOrders userData={userData} />}
          {activeTab === 'security' && <AgentSecurity userData={userData} onAvatarUpdated={(url) => setUserData(p => p ? { ...p, avatar_url: url } : p)} />}
          {activeTab === 'invite' && !isSubAgent && <AgentInvite userData={userData} />}
          {activeTab === 'vip' && <AgentVipStatus userData={userData} />}
          {activeTab === 'credit' && <AgentCredit userData={userData} />}
          {(activeTab === 'deposit' || activeTab === 'wallet') && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Wallet size={48} className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">اضغط على الزر أدناه لإدارة محفظتك</p>
                <button onClick={() => setDepositOpen(true)} className="px-6 py-3 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg, #0c71b2, #00D4FF)' }}>فتح المحفظة</button>
              </div>
            </div>
          )}
        </main>
      </div>
      <BuyBalanceModal open={depositOpen} onClose={() => setDepositOpen(false)} userData={userData} onSuccess={() => { const t = localStorage.getItem('auth_token'); if (t && userData) fetchFullProfile(userData.id, t); }} />
    </div>
  );
}