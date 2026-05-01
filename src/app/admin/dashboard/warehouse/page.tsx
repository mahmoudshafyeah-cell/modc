'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Package, Boxes, TrendingUp, DollarSign, RefreshCw, Warehouse, Truck, FileText, Bell, Layers, Tag, Gift, ClipboardList, Shield, Settings } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

export default function WarehouseDashboardPage() {
  const [stats, setStats] = useState({ totalAssets: 0, availableAssets: 0, soldToday: 0, revenueToday: 0 });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { count: totalAssets } = await supabase.from('assets').select('*', { count: 'exact', head: true });
      const { count: availableAssets } = await supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'available');
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
      const { data: todaySales } = await supabase
        .from('asset_transactions')
        .select('price')
        .in('type', ['system_to_customer', 'agent_to_customer'])
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);
      const soldToday = todaySales?.length || 0;
      const revenueToday = todaySales?.reduce((sum, t) => sum + (t.price || 0), 0) || 0;
      setStats({ totalAssets: totalAssets || 0, availableAssets: availableAssets || 0, soldToday, revenueToday });
      const { data: transactions } = await supabase.from('asset_transactions').select('*').order('created_at', { ascending: false }).limit(10);
      setRecentTransactions(transactions || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }

  const statCards = [
    { label: 'إجمالي الأصول', value: stats.totalAssets, icon: Package, color: '#6C3AFF', link: '/dashboard/warehouse/assets' },
    { label: 'الأصول المتاحة', value: stats.availableAssets, icon: Boxes, color: '#00FF94', link: '/dashboard/warehouse/assets?status=available' },
    { label: 'مبيعات اليوم', value: stats.soldToday, icon: TrendingUp, color: '#FFB800', link: '/dashboard/warehouse/reports' },
    { label: 'إيرادات اليوم', value: `$${stats.revenueToday.toFixed(2)}`, icon: DollarSign, color: '#00D4FF', link: '/dashboard/warehouse/reports' },
  ];

  const quickLinks = [
    { name: 'الأصول', icon: Package, href: '/dashboard/warehouse/assets' },
    { name: 'المنتجات', icon: Tag, href: '/dashboard/warehouse/products' },
    { name: 'المستودعات', icon: Warehouse, href: '/dashboard/warehouse/warehouses' },
    { name: 'الموردين', icon: Truck, href: '/dashboard/warehouse/providers' },
    { name: 'الطلبات', icon: ClipboardList, href: '/dashboard/warehouse/orders' },
    { name: 'المرتجعات', icon: Shield, href: '/dashboard/warehouse/returns' },
    { name: 'الحزم', icon: Gift, href: '/dashboard/warehouse/bundles' },
    { name: 'أنواع الأصول', icon: Layers, href: '/dashboard/warehouse/assetTypes' },
    { name: 'الفئات', icon: Layers, href: '/dashboard/warehouse/categories' },
    { name: 'الشحن', icon: Truck, href: '/dashboard/warehouse/shipping' },
    { name: 'التقارير', icon: FileText, href: '/dashboard/warehouse/reports' },
    { name: 'سجل التدقيق', icon: FileText, href: '/dashboard/warehouse/audit' },
    { name: 'الإشعارات', icon: Bell, href: '/dashboard/warehouse/notifications' },
    { name: 'الإعدادات', icon: Settings, href: '/dashboard/warehouse/settings' },
  ];

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">لوحة تحكم المستودع</h1>
          <button onClick={fetchData} className="p-2 rounded bg-gray-700 hover:bg-gray-600"><RefreshCw size={18} className="text-gray-300" /></button>
        </div>

        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div> : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map(stat => (
                <Link href={stat.link} key={stat.label} className="rounded-xl p-5 bg-dark-100 border border-gray-800 hover:border-cyan-500/50 transition block">
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon size={24} style={{ color: stat.color }} />
                    <span className="text-2xl font-black text-white">{stat.value}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {quickLinks.map(link => (
                <Link key={link.name} href={link.href} className="flex flex-col items-center p-3 rounded-xl bg-dark-100 border border-gray-800 hover:bg-gray-800 transition">
                  <link.icon size={22} className="text-cyan-400 mb-2" />
                  <span className="text-xs text-gray-300">{link.name}</span>
                </Link>
              ))}
            </div>

            <div className="rounded-xl bg-dark-100 border border-gray-800 p-5">
              <h2 className="text-lg font-bold text-white mb-4">آخر الحركات</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-700"><tr>
                    <th className="p-3 text-right">الأصل</th><th className="p-3 text-right">من</th><th className="p-3 text-right">إلى</th>
                    <th className="p-3 text-right">النوع</th><th className="p-3 text-right">السعر</th><th className="p-3 text-right">التاريخ</th>
                  </tr></thead>
                  <tbody>
                    {recentTransactions.map(tx => (
                      <tr key={tx.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="p-3 text-gray-300">{tx.asset_id?.slice(0,8)}</td>
                        <td className="p-3 text-gray-300">{tx.from_user}</td>
                        <td className="p-3 text-gray-300">{tx.to_user}</td>
                        <td className="p-3 text-gray-300">{tx.type}</td>
                        <td className="p-3 text-gray-300">{tx.price ? `$${tx.price}` : '-'}</td>
                        <td className="p-3 text-gray-300">{new Date(tx.created_at).toLocaleString('ar-SY')}</td>
                      </tr>
                    ))}
                    {recentTransactions.length===0 && <tr><td colSpan={6} className="text-center p-6 text-gray-500">لا توجد حركات بعد</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AuthGuard>
  );
}