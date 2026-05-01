'use client';
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, TrendingUp, Wallet, Copy, CheckCircle, ArrowDownCircle, ShoppingCart, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface AgentWalletCardProps {
  onBuyBalance: () => void;
  onSellToCustomer: () => void;
  userData: any;
}

export default function AgentWalletCard({ onBuyBalance, onSellToCustomer, userData }: AgentWalletCardProps) {
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState(0);
  const [dailyProfit, setDailyProfit] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [loading, setLoading] = useState(true);

  const walletId = userData?.id ? `AGT-${userData.id.slice(0, 8).toUpperCase()}` : 'AGT-XXXXXXXX';

  useEffect(() => {
    fetchWallet();
    fetchStats();
  }, []);

  async function fetchWallet() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/wallet?userId=${userData?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setBalance(data.balance || 0);
    } catch (error) {
      console.error('فشل جلب المحفظة:', error);
    }
  }

  async function fetchStats() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDailyProfit(data.dailyProfit || 0);
        setTotalProfit(data.monthlyProfit || 0);
      }
    } catch (error) {
      console.error('فشل جلب الإحصائيات:', error);
    } finally {
      setLoading(false);
    }
  }

  const copyWalletId = () => {
    navigator.clipboard?.writeText(walletId);
    setCopied(true);
    toast.success('تم نسخ معرف المحفظة');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="rounded-3xl p-8 animate-pulse" style={{ background: 'rgba(17,17,40,0.9)', border: '1px solid rgba(0,212,255,0.2)' }}>
        <div className="h-8 w-32 bg-gray-700 rounded mb-4" />
        <div className="h-12 w-48 bg-gray-700 rounded mb-6" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-700 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,0.3) 0%, rgba(108,58,255,0.2) 50%, rgba(17,17,40,0.9) 100%)',
        border: '1px solid rgba(0,212,255,0.4)',
        boxShadow: '0 24px 64px rgba(0,212,255,0.2)',
      }}>
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(108,58,255,0.8) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(0,212,255,0.8) 0%, transparent 40%)' }} />
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.8), rgba(108,58,255,0.8), transparent)' }} />

      <div className="relative p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-2">
              <button onClick={() => setShowBalance(s => !s)} className="text-gray-400 hover:text-white transition-colors">
                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <span className="text-sm font-medium text-gray-300">رصيد الوكيل</span>
              <Wallet size={16} className="text-cyan-300" />
            </div>
            <div className="flex items-end gap-3 justify-end">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(0,255,148,0.15)', color: '#00FF94', border: '1px solid rgba(0,255,148,0.3)' }}>
                <TrendingUp size={12} />
                <span>+${dailyProfit.toFixed(2)}</span>
              </div>
              <p className="text-5xl font-black text-white tabular-nums leading-none">
                {showBalance ? `$${balance.toFixed(2)}` : '••••••'}
              </p>
            </div>
            <p className="text-sm text-gray-400 mt-2 text-right">
              ≈ {showBalance ? `${(balance * 2500).toLocaleString()} ل.س` : '••••• ل.س'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mb-6">
          <button onClick={copyWalletId} className="transition-colors">
            {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-500 hover:text-gray-300" />}
          </button>
          <span className="text-sm font-mono text-gray-400" dir="ltr">{walletId}</span>
          <span className="text-xs text-gray-500">معرف الوكيل:</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl p-3 text-right" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs text-gray-400 mb-1">رصيد متاح</p>
            <p className="font-bold tabular-nums text-sm" style={{ color: '#00FF94' }}>${balance.toFixed(2)}</p>
          </div>
          <div className="rounded-xl p-3 text-right" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs text-gray-400 mb-1">أرباح اليوم</p>
            <p className="font-bold tabular-nums text-sm" style={{ color: '#FFB800' }}>${dailyProfit.toFixed(2)}</p>
          </div>
          <div className="rounded-xl p-3 text-right" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs text-gray-400 mb-1">إجمالي الأرباح</p>
            <p className="font-bold tabular-nums text-sm" style={{ color: '#00D4FF' }}>${totalProfit.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button onClick={onBuyBalance}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 group"
            style={{ background: 'rgba(0,255,148,0.12)', border: '1px solid rgba(0,255,148,0.3)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
              style={{ background: 'rgba(0,255,148,0.2)' }}><ArrowDownCircle size={20} className="text-green-400" /></div>
            <span className="text-sm font-bold text-green-400">شراء رصيد</span>
          </button>

          <button onClick={onSellToCustomer}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 group"
            style={{ background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.3)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
              style={{ background: 'rgba(255,184,0,0.2)' }}><ShoppingCart size={20} className="text-amber-400" /></div>
            <span className="text-sm font-bold text-amber-400">بيع للعملاء</span>
          </button>

          <button
            className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 group"
            style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
              style={{ background: 'rgba(0,212,255,0.2)' }}><DollarSign size={20} className="text-cyan-400" /></div>
            <span className="text-sm font-bold text-cyan-400">الأرباح</span>
          </button>
        </div>
      </div>
    </div>
  );
}