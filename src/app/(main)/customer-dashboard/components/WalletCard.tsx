'use client';
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  ArrowDownCircle, ArrowUpCircle, ArrowLeftRight,
  Eye, EyeOff, TrendingUp, Wallet, Copy, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import TransferModal from './TransferModal';

interface WalletCardProps {
  userId: string;
  onSuccess?: () => void;
}

export interface WalletCardRef {
  openDeposit: () => void;
  openWithdraw: () => void;
  openTransfer: () => void;
}

interface WalletData {
  balance: number;
  reserved_balance: number;
  total_spent: number;
  wallet_id: string;
}

const WalletCard = forwardRef<WalletCardRef, WalletCardProps>(({ userId, onSuccess }, ref) => {
  const [showBalance, setShowBalance] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // تعريض دوال فتح النوافذ للخارج
  useImperativeHandle(ref, () => ({
    openDeposit: () => setDepositOpen(true),
    openWithdraw: () => setWithdrawOpen(true),
    openTransfer: () => setTransferOpen(true),
  }));

  const refreshWallet = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    if (!userId) return;
    fetchWalletData();
  }, [userId, refreshTrigger]);

  async function fetchWalletData() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/wallet?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب بيانات المحفظة');
      setWalletData(data);
    } catch (error: any) {
      console.error('فشل جلب المحفظة:', error);
      toast.error('تعذر تحميل بيانات المحفظة');
    } finally {
      setLoading(false);
    }
  }

  const copyWalletId = () => {
    if (!walletData?.wallet_id) return;
    navigator.clipboard?.writeText(walletData.wallet_id);
    setCopied(true);
    toast.success('تم نسخ معرف المحفظة');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="relative rounded-3xl overflow-hidden p-8" style={{ background: 'rgba(17,17,40,0.9)', border: '1px solid rgba(108,58,255,0.4)' }}>
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const balance = walletData?.balance ?? 0;
  const reserved = walletData?.reserved_balance ?? 0;
  const available = balance - reserved;
  const totalSpent = walletData?.total_spent ?? 0;

  return (
    <>
      <div className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(108,58,255,0.35) 0%, rgba(0,212,255,0.2) 50%, rgba(17,17,40,0.9) 100%)',
          border: '1px solid rgba(108,58,255,0.4)',
          boxShadow: '0 24px 64px rgba(108,58,255,0.3)',
        }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(0,212,255,0.8) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(108,58,255,0.8) 0%, transparent 40%)' }} />
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(108,58,255,0.8), rgba(0,212,255,0.8), transparent)' }} />

        <div className="relative p-8">
          <div className="flex items-start justify-between mb-8">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-2">
                <button onClick={() => setShowBalance(s => !s)} className="text-gray-400 hover:text-white transition-colors">
                  {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <span className="text-sm font-medium text-gray-300">رصيد المحفظة</span>
                <Wallet size={16} className="text-violet-300" />
              </div>
              <div className="flex items-end gap-3 justify-end">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(0,255,148,0.15)', color: '#00FF94', border: '1px solid rgba(0,255,148,0.3)' }}>
                  <TrendingUp size={12} />
                  <span>متاح</span>
                </div>
                <p className="text-5xl font-black text-white tabular-nums leading-none">
                  {showBalance ? `$${available.toFixed(2)}` : '••••••'}
                </p>
              </div>
              <p className="text-sm text-gray-400 mt-2 text-right">
                ≈ {showBalance ? `${(available * 2500).toLocaleString()} ل.س` : '••••• ل.س'}
              </p>
            </div>

            <div className="hidden sm:flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(108,58,255,0.3)', border: '1px solid rgba(108,58,255,0.5)' }}>
                <span className="text-3xl">💳</span>
              </div>
              <div className="flex gap-1">
                {[0,1,2]?.map(i => (
                  <div key={`dot-${i}`} className="w-2 h-2 rounded-full"
                    style={{ background: i === 0 ? '#6C3AFF' : 'rgba(255,255,255,0.2)' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Wallet ID */}
          <div className="flex items-center justify-end gap-2 mb-6">
            <button onClick={copyWalletId} className="transition-colors">
              {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-500 hover:text-gray-300" />}
            </button>
            <span className="text-sm font-mono text-gray-400" dir="ltr">
              {walletData?.wallet_id || 'MDC-XXXX-XXXX'}
            </span>
            <span className="text-xs text-gray-500">معرف المحفظة:</span>
          </div>

          {/* Sub-balances */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="rounded-xl p-3 text-right" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs text-gray-400 mb-1">متاح</p>
              <p className="font-bold tabular-nums text-sm" style={{ color: '#00FF94' }}>
                {showBalance ? `$${available.toFixed(2)}` : '••••'}
              </p>
            </div>
            <div className="rounded-xl p-3 text-right" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs text-gray-400 mb-1">محجوز</p>
              <p className="font-bold tabular-nums text-sm" style={{ color: '#FFB800' }}>
                {showBalance ? `$${reserved.toFixed(2)}` : '••••'}
              </p>
            </div>
            <div className="rounded-xl p-3 text-right" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs text-gray-400 mb-1">إجمالي الإنفاق</p>
              <p className="font-bold tabular-nums text-sm" style={{ color: '#00D4FF' }}>
                {showBalance ? `$${totalSpent.toFixed(2)}` : '••••'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setDepositOpen(true)}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 group"
              style={{ background: 'rgba(0,255,148,0.12)', border: '1px solid rgba(0,255,148,0.3)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{ background: 'rgba(0,255,148,0.2)' }}>
                <ArrowDownCircle size={20} className="text-green-400" />
              </div>
              <span className="text-sm font-bold text-green-400">إيداع</span>
            </button>

            <button onClick={() => setWithdrawOpen(true)}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 group"
              style={{ background: 'rgba(255,68,102,0.12)', border: '1px solid rgba(255,68,102,0.3)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{ background: 'rgba(255,68,102,0.2)' }}>
                <ArrowUpCircle size={20} className="text-red-400" />
              </div>
              <span className="text-sm font-bold text-red-400">سحب</span>
            </button>

            <button onClick={() => setTransferOpen(true)}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 group"
              style={{ background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.3)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{ background: 'rgba(255,184,0,0.2)' }}>
                <ArrowLeftRight size={20} className="text-amber-400" />
              </div>
              <span className="text-sm font-bold text-amber-400">تحويل</span>
            </button>
          </div>
        </div>
      </div>

      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        userId={userId}
        onSuccess={() => { refreshWallet(); if (onSuccess) onSuccess(); }}
      />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        userId={userId}
        currentBalance={available}
        onSuccess={() => { refreshWallet(); if (onSuccess) onSuccess(); }}
      />
      <TransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        userId={userId}
        currentBalance={available}
        onSuccess={() => { refreshWallet(); if (onSuccess) onSuccess(); }}
      />
    </>
  );
});

WalletCard.displayName = 'WalletCard';
export default WalletCard;