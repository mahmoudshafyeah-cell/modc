// src/app/(main)/agent-dashboard/components/AgentVipStatus.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Crown, TrendingUp, DollarSign, Percent, Shield, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface VipLevel {
  id: string;
  name: string;
  min_deposit: number;
  max_deposit: number | null;
  commission_rate: number;
  discount_rate: number;
  color: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface AgentVipStatusProps {
  userData: any;
}

export default function AgentVipStatus({ userData }: AgentVipStatusProps) {
  const [currentLevel, setCurrentLevel] = useState<VipLevel | null>(null);
  const [allLevels, setAllLevels] = useState<VipLevel[]>([]);
  const [totalDeposited, setTotalDeposited] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVipStatus();
  }, []);

  async function fetchVipStatus() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/vip-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentLevel(data.currentLevel);
        setAllLevels(data.allLevels || []);
        setTotalDeposited(data.totalDeposited || 0);
      }
    } catch (error) {
      console.error('فشل جلب حالة VIP:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const nextLevel = allLevels.find(l => l.min_deposit > totalDeposited);
  const progress = nextLevel
    ? Math.min(100, (totalDeposited / nextLevel.min_deposit) * 100)
    : 100;

  const getVipLevelIcon = (level: VipLevel) => {
    if (level.image_url) {
      return <img src={level.image_url} alt={level.name} className="w-12 h-12 rounded-full mx-auto object-cover" />;
    }
    if (level.commission_rate >= 20) return <Crown size={48} className="text-purple-400" />;
    if (level.commission_rate >= 10) return <Award size={48} className="text-cyan-400" />;
    return <Crown size={48} style={{ color: level.color }} />;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          background: currentLevel ? `${currentLevel.color}15` : 'rgba(255,255,255,0.05)',
          border: `1px solid ${currentLevel?.color || '#333'}40`,
        }}
      >
        {currentLevel ? getVipLevelIcon(currentLevel) : <Crown size={48} className="mx-auto mb-3 text-gray-400" />}
        <h2 className="text-2xl font-black text-white mb-2">
          {currentLevel ? currentLevel.name : 'بدون مستوى'}
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          {currentLevel
            ? `نسبة العمولة: ${currentLevel.commission_rate}% | نسبة الخصم: ${currentLevel.discount_rate}%`
            : 'لم يتم تعيين مستوى VIP بعد'}
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 text-sm">
            <DollarSign size={14} className="text-green-400" />
            <span className="text-gray-400">إجمالي الإيداعات:</span>
            <span className="text-white font-bold">${totalDeposited.toFixed(2)}</span>
          </div>
          {currentLevel && (
            <div className="flex items-center gap-1 text-sm">
              <Percent size={14} className="text-cyan-400" />
              <span className="text-gray-400">العمولة الحالية:</span>
              <span className="text-white font-bold">{currentLevel.commission_rate}%</span>
            </div>
          )}
        </div>

        {nextLevel && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>المستوى الحالي</span>
              <span>{nextLevel.name}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${currentLevel?.color || '#666'}, ${nextLevel.color})`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              متبقي ${(nextLevel.min_deposit - totalDeposited).toFixed(2)} للوصول إلى {nextLevel.name}
            </p>
          </div>
        )}
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: '#111128', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Shield size={20} style={{ color: '#0c71b2' }} />
          جميع المستويات
        </h3>

        <div className="space-y-3">
          {allLevels.map((level, index) => {
            const isCurrent = currentLevel?.id === level.id;
            const isAchieved = totalDeposited >= level.min_deposit;

            return (
              <div
                key={level.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  isCurrent ? 'ring-2' : ''
                }`}
                style={{
                  background: isCurrent
                    ? `${level.color}15`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isCurrent ? level.color : 'rgba(255,255,255,0.06)'}`,
                  opacity: isAchieved ? 1 : 0.5,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: isCurrent
                        ? `linear-gradient(135deg, ${level.color}, ${level.color}88)`
                        : 'rgba(255,255,255,0.1)',
                      color: 'white',
                    }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-bold">{level.name}</p>
                    <p className="text-gray-500 text-xs">
                      ${level.min_deposit} - {level.max_deposit ? `$${level.max_deposit}` : '∞'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-400">{level.commission_rate}% عمولة</span>
                  <span className="text-cyan-400">{level.discount_rate}% خصم</span>
                  {isCurrent && (
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{ background: level.color, color: 'white' }}
                    >
                      الحالي
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {allLevels.length === 0 && (
            <p className="text-gray-400 text-center py-4">لا توجد مستويات VIP محددة بعد</p>
          )}
        </div>
      </div>
    </div>
  );
}