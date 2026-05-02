'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import {
  Users, Package, ShoppingCart, DollarSign, TrendingUp,
  Warehouse, Boxes, Truck, Crown, CreditCard, MessageSquare, Image, Settings,
  Shield, AlertTriangle, FileText, Bell, TicketCheck, UserCheck,
  LayoutDashboard, Eye, Zap, Clock, CheckCircle, XCircle, PlusCircle
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Stats {
  totalUsers: number;
  totalAgents: number;
  totalSubAgents: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalAssets: number;
  totalCategories: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingTickets: number;
  lowStock: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAgents: 0,
    totalSubAgents: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalAssets: 0,
    totalCategories: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    pendingTickets: 0,
    lowStock: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
    fetchRecentUsers();
  }, []);

  async function fetchStats() {
    try {
      const [
        { count: totalUsers },
        { count: totalAgents },
        { count: totalSubAgents },
        { count: totalProducts },
        { count: totalOrders },
        { data: ordersData },
        { count: totalAssets },
        { count: totalCategories },
        { count: pendingDeposits },
        { count: pendingWithdrawals },
        { count: pendingTickets },
        { count: lowStock }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'agent'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'sub_agent'),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('purchases').select('*', { count: 'exact', head: true }),
        supabase.from('purchases').select('amount'),
        supabase.from('assets').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('deposit_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock', 5),
      ]);

      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalAgents: totalAgents || 0,
        totalSubAgents: totalSubAgents || 0,
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        totalAssets: totalAssets || 0,
        totalCategories: totalCategories || 0,
        pendingDeposits: pendingDeposits || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        pendingTickets: pendingTickets || 0,
        lowStock: lowStock || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecentOrders() {
    const { data } = await supabase
      .from('purchases')
      .select('id, amount, status, created_at, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentOrders(data || []);
  }

  async function fetchRecentUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentUsers(data || []);
  }

  const statCards = [
    { label: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users, color: '#6C3AFF', href: '/admin/dashboard/platform/users' },
    { label: 'الوكلاء', value: stats.totalAgents, icon: Crown, color: '#FFB800', href: '/admin/dashboard/agents/list' },
    { label: 'الوكلاء الفرعيون', value: stats.totalSubAgents, icon: UserCheck, color: '#FFB800', href: '/admin/dashboard/agents/list' },
    { label: 'المنتجات', value: stats.totalProducts, icon: Package, color: '#00FF94', href: '/admin/dashboard/warehouse/products' },
    { label: 'الطلبات', value: stats.totalOrders, icon: ShoppingCart, color: '#00D4FF', href: '/admin/dashboard/warehouse/orders' },
    { label: 'الإيرادات', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: '#FF4466', href: '/admin/dashboard/reports' },
    { label: 'الأصول', value: stats.totalAssets, icon: Boxes, color: '#0c71b2', href: '/admin/dashboard/warehouse/assets' },
    { label: 'تنبيهات المخزون', value: stats.lowStock, icon: AlertTriangle, color: '#FF6600', href: '/admin/dashboard/warehouse/alerts' },
  ];

  const pendingCards = [
    { label: 'إيداعات معلقة', value: stats.pendingDeposits, icon: PlusCircle, color: '#00D4FF', href: '/admin/dashboard/platform/deposits-withdrawals' },
    { label: 'سحوبات معلقة', value: stats.pendingWithdrawals, icon: XCircle, color: '#FF4466', href: '/admin/dashboard/platform/deposits-withdrawals' },
    { label: 'تذاكر مفتوحة', value: stats.pendingTickets, icon: TicketCheck, color: '#FFB800', href: '/admin/dashboard/tickets' },
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
    { href: '/admin/dashboard/warehouse/categories', label: 'الفئات', icon: LayoutDashboard },
    { href: '/admin/dashboard/warehouse/reports', label: 'التقارير', icon: FileText },
  ];

  return (
    <div dir="rtl" className="space-y-6 p-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-600/20 p-3 rounded-xl">
            <LayoutDashboard size={24} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">لوحة تحكم المدير</h1>
            <p className="text-gray-400 text-sm">مرحباً بك، نظرة عامة على المنصة</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm">
          آخر تحديث: {new Date().toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* البطاقات الإحصائية الرئيسية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.slice(0, 4).map(stat => (
              <Link
                key={stat.label}
                href={stat.href}
                className="block bg-dark-100 rounded-xl p-4 border border-gray-800 hover:border-cyan-500/50 transition-all hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg" style={{ background: `${stat.color}20` }}>
                    <stat.icon size={20} style={{ color: stat.color }} />
                  </div>
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                </div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </Link>
            ))}
          </div>

          {/* البطاقات الإحصائية الثانوية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.slice(4, 8).map(stat => (
              <Link
                key={stat.label}
                href={stat.href}
                className="block bg-dark-100 rounded-xl p-4 border border-gray-800 hover:border-cyan-500/50 transition-all hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg" style={{ background: `${stat.color}20` }}>
                    <stat.icon size={20} style={{ color: stat.color }} />
                  </div>
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                </div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </Link>
            ))}
            {pendingCards.map(stat => (
              <Link
                key={stat.label}
                href={stat.href}
                className="block bg-dark-100 rounded-xl p-4 border border-gray-800 hover:border-cyan-500/50 transition-all hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg" style={{ background: `${stat.color}20` }}>
                    <stat.icon size={20} style={{ color: stat.color }} />
                  </div>
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                </div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </Link>
            ))}
          </div>

          {/* الروابط السريعة */}
          <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap size={18} className="text-cyan-400" />
              الوصول السريع
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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

          {/* آخر الطلبات وآخر المستخدمين */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* آخر الطلبات */}
            <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingCart size={18} className="text-cyan-400" />
                  آخر الطلبات
                </h2>
                <Link href="/admin/dashboard/warehouse/orders" className="text-cyan-400 text-sm hover:underline">عرض الكل</Link>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-gray-400 text-center py-6">لا توجد طلبات بعد</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                      <div>
                        <p className="text-white text-sm">{order.profiles?.email || 'مستخدم'}</p>
                        <p className="text-gray-500 text-xs">{new Date(order.created_at).toLocaleDateString('ar-SY')}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-cyan-400 font-bold">${order.amount?.toFixed(2)}</p>
                        <p className={`text-xs ${order.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {order.status === 'completed' ? 'مكتمل' : 'قيد المعالجة'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* آخر المستخدمين */}
            <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users size={18} className="text-cyan-400" />
                  آخر المستخدمين
                </h2>
                <Link href="/admin/dashboard/platform/users" className="text-cyan-400 text-sm hover:underline">عرض الكل</Link>
              </div>
              {recentUsers.length === 0 ? (
                <p className="text-gray-400 text-center py-6">لا توجد مستخدمين جدد</p>
              ) : (
                <div className="space-y-3">
                  {recentUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                      <div>
                        <p className="text-white text-sm">{user.full_name || user.email}</p>
                        <p className="text-gray-500 text-xs">{user.email}</p>
                      </div>
                      <div className="text-left">
                        <p className={`text-xs px-2 py-1 rounded ${user.role === 'super_admin' ? 'bg-cyan-600/20 text-cyan-400' : user.role === 'agent' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-green-600/20 text-green-400'}`}>
                          {user.role === 'super_admin' ? 'مدير' : user.role === 'agent' ? 'وكيل' : 'عميل'}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">{new Date(user.created_at).toLocaleDateString('ar-SY')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}