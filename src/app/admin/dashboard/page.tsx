'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Users, Package, ShoppingCart, DollarSign, TrendingUp,
  Warehouse, Boxes, Truck, Crown, CreditCard, MessageSquare, Image, Settings
} from 'lucide-react';
import Link from 'next/link';

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
    <div dir="rtl" className="space-y-6">
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
          {/* البطاقات الإحصائية */}
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

          {/* الروابط السريعة */}
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






 const sections = [
    {
      id: 'warehouse',
      label: 'إدارة المستودع',
      icon: Warehouse,
      items: [
        { href: '/admin/dashboard/warehouse', label: 'لوحة المستودع', icon: BarChart3 },
        { href: '/admin/dashboard/warehouse/assets', label: 'الأصول', icon: Boxes },
        { href: '/admin/dashboard/warehouse/products', label: 'المنتجات المحلية', icon: Package },
        { href: '/admin/dashboard/warehouse/warehouses', label: 'المستودعات', icon: Layers },
        { href: '/admin/dashboard/warehouse/providers', label: 'الموردون', icon: Truck },
        { href: '/admin/dashboard/warehouse/orders', label: 'الطلبات والمرتجعات', icon: ClipboardList },
        { href: '/admin/dashboard/warehouse/reports', label: 'التقارير', icon: FileText },
        { href: '/admin/dashboard/warehouse/settings', label: 'إعدادات المستودع', icon: Settings },
        { href: '/admin/dashboard/warehouse/categories', label: 'فئات الأصول', icon: Folder },
        { href: '/admin/dashboard/warehouse/asset-types', label: 'أنواع الأصول', icon: Tag },
        { href: '/admin/dashboard/warehouse/alerts', label: 'تنبيهات المخزون', icon: AlertTriangle },
        { href: '/admin/dashboard/warehouse/shipping', label: 'طلبات الشحن', icon: Truck },
        { href: '/admin/dashboard/warehouse/bundles', label: 'الحزم', icon: Package },
      ]
    },
    {
      id: 'agents',
      label: 'إدارة الوكلاء',
      icon: Users,
      items: [
        { href: '/admin/dashboard/agents/list', label: 'قائمة الوكلاء', icon: UserCheck },
        { href: '/admin/dashboard/agents/purchase', label: 'شراء الوكيل', icon: ShoppingCart },
        { href: '/admin/dashboard/agents/inventory', label: 'مخزون الوكيل', icon: Briefcase },
        { href: '/admin/dashboard/agents/orders', label: 'الطلبات', icon: ClipboardList },
        { href: '/admin/dashboard/agents/returns', label: 'المرتجعات', icon: RefreshCcw },
        { href: '/admin/dashboard/agents/vip-levels', label: 'مستويات VIP', icon: Crown },
        { href: '/admin/dashboard/agents/commissions', label: 'عمولات الوكلاء', icon: DollarSign },
        { href: '/admin/dashboard/agents/credits', label: 'حدود الائتمان', icon: CreditCard },
        { href: '/admin/dashboard/agents/credit-requests', label: 'طلبات المديونية', icon: FileText },
        { href: '/admin/dashboard/agents/kyc', label: 'طلبات KYC', icon: Shield },
      ]
    },
    {
      id: 'platform',
      label: 'إدارة المنصة',
      icon: Globe,
      items: [
        { href: '/admin/dashboard/platform/users', label: 'مستخدمو المنصة', icon: Users },
        { href: '/admin/dashboard/platform/live', label: 'المنصة الحية', icon: Globe },
        { href: '/admin/dashboard/platform/deposits-withdrawals', label: 'الإيداعات والسحوبات', icon: ArrowDownUp },
        { href: '/admin/dashboard/platform/p2p-deposits', label: 'إيداعات P2P', icon: ArrowDownUp },
        { href: '/admin/dashboard/platform/banners', label: 'إدارة البانرات', icon: Image },
        { href: '/admin/dashboard/platform/ticker', label: 'الشريط الإخباري', icon: MessageSquare },
      ]
    },
    {
      id: 'customers_support',
      label: 'العملاء والدعم',
      icon: UserRound,
      items: [
        { href: '/admin/dashboard/customers', label: 'العملاء', icon: UserRound },
        { href: '/admin/dashboard/tickets', label: 'الدعم الفني', icon: TicketCheck },
        { href: '/admin/dashboard/coupons', label: 'الكوبونات', icon: TicketPercent },
      ]
    },
    {
      id: 'reports_logs',
      label: 'التقارير والسجلات',
      icon: FileText,
      items: [
        { href: '/admin/dashboard/reports', label: 'التقارير', icon: FileText },
        { href: '/admin/dashboard/transactions', label: 'سجل الحركات', icon: History },
        { href: '/admin/dashboard/audit-log', label: 'سجل التدقيق', icon: ScrollText },
        { href: '/admin/dashboard/connection-logs', label: 'سجل الاتصال', icon: Wifi },
        { href: '/admin/dashboard/notifications', label: 'الإشعارات', icon: Bell },
        { href: '/admin/dashboard/alerts', label: 'التنبيهات', icon: Bell },
      ]
    },
    {
      id: 'management',
      label: 'الإدارة',
      icon: Shield,
      items: [
        { href: '/admin/dashboard/users', label: 'المستخدمين', icon: Users },
        { href: '/admin/dashboard/staff-tracking', label: 'تتبع الموظفين', icon: UserCheck },
        { href: '/admin/dashboard/roles', label: 'الأدوار والصلاحيات', icon: Shield },
        { href: '/admin/dashboard/payment-methods', label: 'طرق الدفع', icon: DollarSign },
        { href: '/admin/dashboard/profile', label: 'الملف الشخصي', icon: User },
        { href: '/admin/dashboard/change-password', label: 'تغيير كلمة المرور', icon: Key },
        { href: '/admin/dashboard/settings', label: 'الإعدادات', icon: Settings },
      ]
    },
  ];

  return (
    <aside className="w-64 bg-dark-100 border-l border-gray-800 h-screen sticky top-0 flex flex-col overflow-y-auto" dir="rtl">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">ModC</h2>
        <p className="text-gray-400 text-sm">لوحة التحكم</p>
      </div>

      <nav className="flex-1 p-2">
        {sections.map(section => {
          const isOpen = openSections[section.id];
          return (
            <div key={section.id} className="mb-1">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-2 rounded-lg text-gray-300 hover:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  <section.icon size={18} />
                  <span className="text-sm">{section.label}</span>
                </div>
                {isOpen ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
              </button>
              {isOpen && (
                <div className="mr-4 space-y-0.5">
                  {section.items.map(item => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 p-2 rounded-lg text-sm transition ${active ? 'bg-cyan-600/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                      >
                        <item.icon size={14} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button onClick={handleLogout} className="flex items-center gap-2 p-2 rounded-lg text-red-400 hover:bg-red-500/10 w-full">
          <LogOut size={18} />
          <span className="text-sm">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}