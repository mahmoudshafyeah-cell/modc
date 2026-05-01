'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PlatformUsersPage from '@/app/dashboard/platform/users/page';
import PaymentMethodsPage from '@/app/dashboard/payment-methods/page';
import ProductsPage from '@/app/dashboard/warehouse/products/page';
import CouponsPage from '@/app/dashboard/coupons/page';
import CustomersPage from '@/app/dashboard/customers/page';
import TicketsPage from '@/app/dashboard/tickets/page';
import SettingsPage from '@/app/dashboard/settings/page';
import { Package, Users, CreditCard, TicketPercent, UserRound, TicketCheck, Settings } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

export default function LivePlatformPage() {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const tabs = [
    { id: 'products', label: 'المنتجات', icon: Package, component: ProductsPage, permission: 'manage_products' },
    { id: 'users', label: 'المستخدمين', icon: Users, component: PlatformUsersPage, permission: 'access_platform_api' },
    { id: 'paymentMethods', label: 'طرق الدفع', icon: CreditCard, component: PaymentMethodsPage, permission: 'manage_settings' },
    { id: 'coupons', label: 'الكوبونات', icon: TicketPercent, component: CouponsPage, permission: 'view_coupons' },
    { id: 'customers', label: 'العملاء', icon: UserRound, component: CustomersPage, permission: 'manage_customers' },
    { id: 'tickets', label: 'التذاكر', icon: TicketCheck, component: TicketsPage, permission: 'view_tickets' },
    { id: 'settings', label: 'الإعدادات', icon: Settings, component: SettingsPage, permission: 'manage_settings' },
  ].filter(tab => hasPermission(tab.permission));
  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || ProductsPage;
  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-bold text-white">المنصة الحية</h1>
        <div className="flex gap-2 flex-wrap border-b pb-3">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition ${activeTab === tab.id ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
              <tab.icon size={18} /><span>{tab.label}</span>
            </button>
          ))}
        </div>
        <ActiveComponent />
      </div>
    </AuthGuard>
  );
}