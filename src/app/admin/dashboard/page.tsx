'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import {
  Users, Package, ShoppingCart, DollarSign, TrendingUp,
  Warehouse, Boxes, Truck, Crown, CreditCard, MessageSquare, Image, Settings
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Stats {
  totalUsers: number;
  totalAgents: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalAssets: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAgents: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalAssets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [
        { count: totalUsers },
        { count: totalAgents },
        { count: totalProducts },
        { count: totalOrders },
        { data: ordersData },
        { count: totalAssets }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['agent', 'sub_agent']),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('purchases').select('*', { count: 'exact', head: true }),
        supabase.from('purchases').select('amount'),
        supabase.from('assets').select('*', { count: 'exact', head: true }),
      ]);

      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalAgents: totalAgents || 0,
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        totalAssets: totalAssets || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users, color: '#6C3AFF', href: '/admin/dashboard/platform/users' },
    { label: 'الوكلاء', value: stats.totalAgents, icon: Crown, color: '#FFB800', href: '/admin/dashboard/agents/list' },
    { label: 'المنتجات', value: stats.totalProducts, icon: Package, color: '#00FF94', href: '/admin/dashboard/warehouse/products' },
    { label: 'الطلبات', value: stats.totalOrders, icon: ShoppingCart, color: '#00D4FF', href: '/admin/dashboard/warehouse/orders' },
    { label: 'إجمالي الإيرادات', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: '#FF4466', href: '/admin/dashboard/reports' },
    { label: 'الأصول', value: stats.totalAssets, icon: Boxes, color: '#0c71b2', href: '/admin/dashboard/warehouse/assets' },
  ];

  const quickLinks = [
    { href: '/admin/dashboard/warehouse/products', label: 'المنتجات', icon: Package },
    { href: '/admin/dashboard/warehouse/assets', label: 'الأصول', icon: Boxes },
    { href: '/admin/dashboard/warehouse/warehouses', label: 'المستودعات', icon: Warehouse },
    { href: '/admin/dashboard/warehouse/providers', label: 'الموردون', icon: Truck },
    { href: '/admin/dashboard/agents/list', label: 'الوكلاء', icon: Crown },
    { href: '/admin/dashboard/platform/users', label: 'المستخدمين', icon: Users },
    { href: '/admin/dashboard/platform/banners', label: 'البانرات', icon: Image },
    { href: '/admin/dashboard/platform/ticker', label: 'الشريط الإخباري', icon: MessageSquare },
    { href: '/admin/dashboard/payment-methods', label: 'طرق الدفع', icon: CreditCard },
    { href: '/admin/dashboard/settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <div dir="rtl" className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">لوحة تحكم المدير</h1>
        <p className="text-gray-400 text-sm">
          آخر تحديث: {new Date().toLocaleDateString('ar-SY')}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {statCards.map(stat => (
              <Link
                key={stat.label}
                href={stat.href}
                className="block bg-dark-100 rounded-xl p-4 border border-gray-800 hover:border-cyan-500/50 transition-all hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <stat.icon size={24} style={{ color: stat.color }} />
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                </div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </Link>
            ))}
          </div>


          <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-cyan-400" />
              الوصول السريع
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {quickLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition group"
                >
                  <link.icon size={16} className="text-cyan-400 group-hover:text-cyan-300" />
                  <span className="text-white text-sm">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}