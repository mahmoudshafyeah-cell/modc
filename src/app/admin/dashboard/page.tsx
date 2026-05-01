'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // التحقق من وجود التوكن
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <div className="p-8 text-right" dir="rtl">
      <h1 className="text-3xl font-bold text-white mb-4">لوحة تحكم المدير</h1>
      <p className="text-gray-400">مرحباً بك في لوحة التحكم. يمكنك من هنا إدارة:</p>
      <ul className="list-disc list-inside text-gray-300 mt-4 space-y-2">
        <li>إدارة المستخدمين والوكلاء</li>
        <li>إدارة المنتجات والأصول</li>
        <li>إعدادات المنصة</li>
        <li>والمزيد...</li>
      </ul>
    </div>
  );
}