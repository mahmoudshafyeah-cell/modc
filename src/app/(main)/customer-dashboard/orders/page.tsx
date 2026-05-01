'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import OrdersTable from '../components/OrdersTable';

export default function OrdersPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.id);
    }
  }, []);

  if (!userId) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/customer-dashboard" className="text-gray-400 hover:text-white">
          <ArrowRight size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">طلباتي</h1>
      </div>
      <OrdersTable userId={userId} />
    </div>
  );
}