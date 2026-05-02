'use client';
import { useRouter } from 'next/navigation';
import { LogOut, Home, Package, Settings, Users } from 'lucide-react';

export default function DashboardSidebar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    router.push('/admin/login');
  };

  return (
    <aside className="w-64 bg-dark-100 border-l border-gray-800 h-screen sticky top-0 flex flex-col" dir="rtl">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">ModC</h2>
        <p className="text-gray-400 text-sm">لوحة التحكم</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <a href="/admin/dashboard" className="flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-800">
          <Home size={18} /> الرئيسية
        </a>
        <a href="/admin/dashboard/products" className="flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-800">
          <Package size={18} /> المنتجات
        </a>
        <a href="/admin/dashboard/users" className="flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-800">
          <Users size={18} /> المستخدمون
        </a>
        <a href="/admin/dashboard/settings" className="flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-800">
          <Settings size={18} /> الإعدادات
        </a>
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <button onClick={handleLogout} className="flex items-center gap-3 p-2 rounded-lg text-red-400 hover:bg-red-500/10 w-full">
          <LogOut size={18} /> تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}