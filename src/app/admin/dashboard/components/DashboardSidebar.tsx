'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Package, Boxes, Truck, Settings, BarChart3, Folder, Tag,
  AlertTriangle, ShoppingCart, Users, Crown, FileText,
  Globe, UserCheck, LogOut, Warehouse, CreditCard, Image, MessageSquare
} from 'lucide-react';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      router.push('/admin/login');
    }
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  const navItems = [
    { href: '/admin/dashboard', label: 'الرئيسية', icon: Home },
    { href: '/admin/dashboard/warehouse/products', label: 'المنتجات', icon: Package },
    { href: '/admin/dashboard/warehouse/assets', label: 'الأصول', icon: Boxes },
    { href: '/admin/dashboard/warehouse/warehouses', label: 'المستودعات', icon: Warehouse },
    { href: '/admin/dashboard/warehouse/providers', label: 'الموردون', icon: Truck },
    { href: '/admin/dashboard/agents/list', label: 'الوكلاء', icon: Crown },
    { href: '/admin/dashboard/platform/users', label: 'المستخدمين', icon: Users },
    { href: '/admin/dashboard/platform/banners', label: 'البانرات', icon: Image },
    { href: '/admin/dashboard/platform/ticker', label: 'الشريط الإخباري', icon: MessageSquare },
    { href: '/admin/dashboard/settings', label: 'الإعدادات', icon: Settings },
  ];

  if (!mounted) {
    return <aside className="w-64 bg-dark-100 border-l border-gray-800 h-screen" />;
  }

  return (
    <aside className="w-64 bg-dark-100 border-l border-gray-800 h-screen sticky top-0 flex flex-col" dir="rtl">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">ModC</h2>
        <p className="text-gray-400 text-sm">لوحة التحكم</p>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        {navItems.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 p-2 rounded-lg text-sm transition mb-1 ${active ? 'bg-cyan-600/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button onClick={handleLogout} className="flex items-center gap-2 p-2 rounded-lg text-red-400 hover:bg-red-500/10 w-full">
          <LogOut size={16} />
          <span className="text-sm">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}