'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Package, Boxes, Truck, Settings, BarChart3, Folder, Tag,
  AlertTriangle, ShoppingCart, Users, Crown, FileText,
  Globe, UserCheck, LogOut, Warehouse, CreditCard, Image, MessageSquare,
  ChevronDown, ChevronLeft, LayoutDashboard, TicketCheck, Bell, Shield, DollarSign
} from 'lucide-react';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    warehouse: true,
    agents: false,
    platform: false,
    reports: false,
    management: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      router.push('/admin/login');
    }
  };

  const sections = [
    {
      id: 'main',
      label: 'الرئيسية',
      icon: LayoutDashboard,
      items: [
        { href: '/admin/dashboard', label: 'لوحة التحكم', icon: Home },
      ]
    },
    {
      id: 'warehouse',
      label: 'إدارة المستودع',
      icon: Warehouse,
      items: [
        { href: '/admin/dashboard/warehouse', label: 'لوحة المستودع', icon: BarChart3 },
        { href: '/admin/dashboard/warehouse/assets', label: 'الأصول', icon: Boxes },
        { href: '/admin/dashboard/warehouse/products', label: 'المنتجات', icon: Package },
        { href: '/admin/dashboard/warehouse/warehouses', label: 'المستودعات', icon: Warehouse },
        { href: '/admin/dashboard/warehouse/providers', label: 'الموردون', icon: Truck },
        { href: '/admin/dashboard/warehouse/orders', label: 'الطلبات', icon: ShoppingCart },
        { href: '/admin/dashboard/warehouse/reports', label: 'التقارير', icon: FileText },
        { href: '/admin/dashboard/warehouse/settings', label: 'إعدادات المستودع', icon: Settings },
        { href: '/admin/dashboard/warehouse/categories', label: 'فئات الأصول', icon: Folder },
        { href: '/admin/dashboard/warehouse/asset-types', label: 'أنواع الأصول', icon: Tag },
        { href: '/admin/dashboard/warehouse/alerts', label: 'تنبيهات المخزون', icon: AlertTriangle },
        { href: '/admin/dashboard/warehouse/shipping', label: 'طلبات الشحن', icon: Truck },
      ]
    },
    {
      id: 'agents',
      label: 'إدارة الوكلاء',
      icon: Crown,
      items: [
        { href: '/admin/dashboard/agents/list', label: 'قائمة الوكلاء', icon: UserCheck },
        { href: '/admin/dashboard/agents/purchase', label: 'شراء الوكيل', icon: ShoppingCart },
        { href: '/admin/dashboard/agents/inventory', label: 'مخزون الوكيل', icon: Boxes },
        { href: '/admin/dashboard/agents/orders', label: 'طلبات الوكيل', icon: ShoppingCart },
        { href: '/admin/dashboard/agents/returns', label: 'المرتجعات', icon: AlertTriangle },
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
        { href: '/admin/dashboard/platform/deposits-withdrawals', label: 'الإيداعات والسحوبات', icon: DollarSign },
        { href: '/admin/dashboard/platform/p2p-deposits', label: 'إيداعات P2P', icon: DollarSign },
        { href: '/admin/dashboard/platform/banners', label: 'البانرات', icon: Image },
        { href: '/admin/dashboard/platform/ticker', label: 'الشريط الإخباري', icon: MessageSquare },
      ]
    },
    {
      id: 'customers_support',
      label: 'العملاء والدعم',
      icon: Users,
      items: [
        { href: '/admin/dashboard/customers', label: 'العملاء', icon: Users },
        { href: '/admin/dashboard/tickets', label: 'الدعم الفني', icon: TicketCheck },
        { href: '/admin/dashboard/coupons', label: 'الكوبونات', icon: Tag },
      ]
    },
    {
      id: 'reports',
      label: 'التقارير والسجلات',
      icon: FileText,
      items: [
        { href: '/admin/dashboard/reports', label: 'التقارير', icon: FileText },
        { href: '/admin/dashboard/transactions', label: 'سجل الحركات', icon: FileText },
        { href: '/admin/dashboard/audit-log', label: 'سجل التدقيق', icon: FileText },
        { href: '/admin/dashboard/connection-logs', label: 'سجل الاتصال', icon: Globe },
        { href: '/admin/dashboard/notifications', label: 'الإشعارات', icon: Bell },
        { href: '/admin/dashboard/alerts', label: 'التنبيهات', icon: AlertTriangle },
      ]
    },
    {
      id: 'management',
      label: 'الإدارة',
      icon: Settings,
      items: [
        { href: '/admin/dashboard/users', label: 'المستخدمين', icon: Users },
        { href: '/admin/dashboard/staff-tracking', label: 'تتبع الموظفين', icon: UserCheck },
        { href: '/admin/dashboard/roles', label: 'الأدوار والصلاحيات', icon: Shield },
        { href: '/admin/dashboard/payment-methods', label: 'طرق الدفع', icon: CreditCard },
        { href: '/admin/dashboard/profile', label: 'الملف الشخصي', icon: UserCheck },
        { href: '/admin/dashboard/change-password', label: 'تغيير كلمة المرور', icon: Shield },
        { href: '/admin/dashboard/settings', label: 'الإعدادات', icon: Settings },
      ]
    },
  ];

  if (!mounted) {
    return <aside className="w-64 bg-dark-100 border-l border-gray-800 h-screen" />;
  }

  return (
    <aside className="w-64 bg-dark-100 border-l border-gray-800 h-screen sticky top-0 flex flex-col overflow-y-auto" dir="rtl">
      {/* الهيدر */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">ModC</h2>
        <p className="text-gray-400 text-sm">لوحة التحكم</p>
      </div>

      {/* القائمة */}
      <nav className="flex-1 p-2 space-y-1">
        {sections.map(section => {
          const isOpen = openSections[section.id];
          const hasItems = section.items.length > 0;

          return (
            <div key={section.id} className="mb-1">
              {hasItems && section.id !== 'main' ? (
                <>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-gray-300 hover:bg-gray-800 transition"
                  >
                    <div className="flex items-center gap-2">
                      <section.icon size={18} />
                      <span className="text-sm">{section.label}</span>
                    </div>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
                  </button>
                  {isOpen && (
                    <div className="mr-4 mt-0.5 space-y-0.5">
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
                </>
              ) : (
                <Link
                  href={section.items[0]?.href}
                  className={`flex items-center gap-2 p-2 rounded-lg text-sm transition ${isActive(section.items[0]?.href) ? 'bg-cyan-600/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                  <section.icon size={18} />
                  <span>{section.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* زر الخروج */}
      <div className="p-4 border-t border-gray-800 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-2 rounded-lg text-red-400 hover:bg-red-500/10 w-full transition"
        >
          <LogOut size={18} />
          <span className="text-sm">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}