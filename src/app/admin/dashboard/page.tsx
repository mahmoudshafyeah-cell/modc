'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, Settings } from 'lucide-react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 });

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const { data: revenueData } = await supabase.from('orders').select('total');
    const totalRevenue = revenueData?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    setStats({ totalUsers: totalUsers || 0, totalProducts: totalProducts || 0, totalOrders: totalOrders || 0, totalRevenue });
  }

  const statCards = [
    { label: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users, color: '#6C3AFF' },
    { label: 'إجمالي المنتجات', value: stats.totalProducts, icon: Package, color: '#00FF94' },
    { label: 'إجمالي الطلبات', value: stats.totalOrders, icon: ShoppingCart, color: '#FFB800' },
    { label: 'إجمالي الإيرادات', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: '#00D4FF' },
  ];

  const quickLinks = [
    { href: '/dashboard/warehouse/assets', label: 'إدارة الأصول', icon: Package },
    { href: '/dashboard/agents/list', label: 'الوكلاء', icon: Users },
    { href: '/dashboard/platform/users', label: 'مستخدمي المنصة', icon: Users },
    { href: '/dashboard/warehouse/products', label: 'المنتجات', icon: Package },
    { href: '/dashboard/warehouse/reports', label: 'التقارير', icon: TrendingUp },
    { href: '/dashboard/settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/customer-dashboard">
      <div dir="rtl" className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-white">لوحة تحكم المدير</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(stat => (
            <div key={stat.label} className="bg-dark-100 rounded-xl p-5 border border-gray-800">
              <div className="flex justify-between items-center mb-3"><stat.icon size={24} style={{ color: stat.color }} /><span className="text-2xl font-bold text-white">{stat.value}</span></div>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-dark-100 rounded-xl p-5 border border-gray-800">
          <h2 className="text-lg font-bold text-white mb-4">الوصول السريع</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {quickLinks.map(link => (<Link key={link.href} href={link.href} className="flex items-center gap-2 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition"><link.icon size={18} className="text-cyan-400" /><span className="text-white text-sm">{link.label}</span></Link>))}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}