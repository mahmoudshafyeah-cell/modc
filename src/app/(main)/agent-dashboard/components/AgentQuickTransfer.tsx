'use client';
import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Zap, X, CreditCard, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface AgentQuickTransferProps {
  onBuyBalance: () => void;
  onGoToInventory: () => void; // دالة جديدة للانتقال إلى تبويب المخزون
}

export default function AgentQuickTransfer({ onBuyBalance, onGoToInventory }: AgentQuickTransferProps) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  async function fetchCustomers() {
    setLoadingCustomers(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setCustomers(data.customers || []);
    } catch (error) {
      console.error('فشل جلب العملاء:', error);
    } finally {
      setLoadingCustomers(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (transferOpen) fetchCustomers();
  }, [transferOpen]);

  const handleSend = async () => {
    if (!amount || !recipient) {
      toast.error('يرجى إدخال المبلغ والمستلم');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient,
          amount: parseFloat(amount),
          note: 'تحويل من وكيل',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحويل');

      setSent(true);
      toast.success(`تم تحويل $${amount} بنجاح`);
      setTimeout(() => {
        setSent(false);
        setTransferOpen(false);
        setAmount('');
        setRecipient('');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl p-6" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.2)' }}>
              <Zap size={15} style={{ color: '#00D4FF' }} />
            </div>
          </div>
          <h3 className="text-sm font-bold text-white">أدوات التحويل السريع</h3>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={onBuyBalance}
            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105 hover:-translate-y-1"
            style={{ background: 'rgba(0,255,148,0.1)', border: '1px solid rgba(0,255,148,0.2)' }}
          >
            <ArrowDownCircle size={22} style={{ color: '#00FF94' }} />
            <span className="text-xs font-bold" style={{ color: '#00FF94' }}>شراء رصيد</span>
          </button>

          <button
            onClick={onGoToInventory}
            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105 hover:-translate-y-1"
            style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.2)' }}
          >
            <ArrowUpCircle size={22} style={{ color: '#FFB800' }} />
            <span className="text-xs font-bold" style={{ color: '#FFB800' }}>بيع للعميل</span>
          </button>

          <button
            onClick={() => setTransferOpen(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105 hover:-translate-y-1"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
          >
            <Zap size={22} style={{ color: '#00D4FF' }} />
            <span className="text-xs font-bold" style={{ color: '#00D4FF' }}>تحويل سريع</span>
          </button>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 mb-3 text-right">العملاء الأخيرون</p>
          <div className="space-y-2">
            {loadingCustomers ? (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
              </div>
            ) : customers.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">لا يوجد عملاء حاليًا</p>
            ) : (
              customers.map(c => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:bg-cyan-500/5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onClick={() => { setRecipient(c.phone); setTransferOpen(true); }}
                >
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:scale-105"
                      style={{ background: `${c.color}15`, color: c.color }}
                      onClick={e => {
                        e.stopPropagation();
                        setRecipient(c.phone);
                        setAmount(c.lastAmount.replace('$', ''));
                        setTransferOpen(true);
                      }}
                    >
                      تحويل
                    </button>
                    <span className="text-xs text-gray-400" dir="ltr">{c.lastAmount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{c.name}</p>
                      <p className="text-xs text-gray-500" dir="ltr">{c.phone}</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `${c.color}20`, color: c.color }}>
                      {c.name.charAt(0)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {transferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#111128', border: '1px solid rgba(0,212,255,0.3)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
              <button onClick={() => setTransferOpen(false)} className="text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
              <h3 className="text-sm font-bold text-white">تحويل سريع</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <Smartphone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="رقم الهاتف أو البريد الإلكتروني" className="input-field pr-9 text-right text-sm w-full h-10" />
              </div>
              <div className="relative">
                <CreditCard size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="المبلغ ($)" type="number" className="input-field pr-9 text-right text-sm w-full h-10" />
              </div>
              <div className="flex gap-2">
                {['10', '25', '50', '100'].map(v => (
                  <button key={v} onClick={() => setAmount(v)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{
                      background: amount === v ? 'rgba(0,212,255,0.25)' : 'rgba(0,212,255,0.08)',
                      border: `1px solid ${amount === v ? 'rgba(0,212,255,0.5)' : 'rgba(0,212,255,0.15)'}`,
                      color: '#00D4FF',
                    }}>
                    ${v}
                  </button>
                ))}
              </div>
              <button onClick={handleSend} disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-60"
                style={{
                  background: sent ? 'rgba(0,255,148,0.2)' : 'linear-gradient(135deg, #00D4FF, #6C3AFF)',
                  border: sent ? '1px solid rgba(0,255,148,0.4)' : 'none',
                  color: sent ? '#00FF94' : 'white',
                }}>
                {loading ? 'جاري التحويل...' : sent ? 'تم التحويل ✓' : 'تحويل الآن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}