'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <div className="p-8 text-right" dir="rtl">
      <h1 className="text-3xl font-bold text-white mb-4">لوحة تحكم المدير</h1>
      <p className="text-gray-400 mb-6">مرحباً بك في لوحة التحكم. الأقسام المتاحة:</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-dark-100 p-4 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-2">إدارة المستخدمين</h2>
          <p className="text-gray-400 text-sm">إدارة المستخدمين والوكلاء والصلاحيات</p>
        </div>
        <div className="bg-dark-100 p-4 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-2">إدارة المنتجات</h2>
          <p className="text-gray-400 text-sm">إدارة المنتجات والأصول الرقمية</p>
        </div>
        <div className="bg-dark-100 p-4 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-2">الإعدادات</h2>
          <p className="text-gray-400 text-sm">إعدادات المنصة العامة</p>
        </div>
      </div>
    </div>
  );
}