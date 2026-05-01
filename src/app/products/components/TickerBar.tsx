'use client';
import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';

interface TickerItem {
  id: string;
  text: string;
  speed: number;
  is_active: boolean;
}

export default function TickerBar() {
  const [ticker, setTicker] = useState<TickerItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicker();
  }, []);

  async function fetchTicker() {
    try {
      const token = localStorage.getItem('auth_token'); // ✅ نجلب التوكن
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`; // ✅ نرسله إذا وُجد

      const res = await fetch('/api/admin/ticker?is_active=true', { headers });
      if (res.status === 401) {
        // المستخدم غير مسجل دخول، نتجاهل الشريط
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (res.ok && data.ticker) {
        setTicker(data.ticker);
      }
    } catch (e) {
      console.error('فشل جلب الشريط الإخباري:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !ticker) return null;

  const duration = ticker.speed || 20;

  return (
    <div className="bg-dark-100 border border-gray-700 rounded-xl py-2.5 px-4 mb-6 overflow-hidden" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
          <Megaphone size={16} className="text-violet-400" />
        </div>
        <div className="overflow-hidden flex-1">
          <div
            className="whitespace-nowrap text-violet-300 text-sm font-semibold"
            style={{
              animation: `scrollTicker ${duration}s linear infinite`,
            }}
          >
            {ticker.text}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes scrollTicker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}