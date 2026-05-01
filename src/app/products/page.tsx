// src/app/products/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Zap } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';

// مكونات البانر والشريط الإخباري
import ProductBanner from './components/ProductBanner';
import TickerBar from './components/TickerBar';

// مكونات الـ Sidebar و Topbar الخاصة بالأدوار
// (يجب التأكد من وجود هذه المسارات)
import DashboardSidebar from '@/app/dashboard/components/DashboardSidebar'; // للمدير
import AgentSidebar from '@/app/(main)/agent-dashboard/components/AgentSidebar'; // للوكيل
import CustomerSidebar from '@/app/(main)/customer-dashboard/components/DashboardSidebar'; // للعميل

import AgentTopbar from '@/app/(main)/agent-dashboard/components/AgentTopbar';
import CustomerTopbar from '@/app/(main)/customer-dashboard/components/DashboardTopbar';

// مكون Topbar افتراضي للمدير (إذا لم يكن موجوداً)
const AdminTopbar = ({ userData }: { userData: any }) => (
  <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-dark-100">
    <div></div>
    <div className="text-white">مرحباً {userData?.full_name || 'مدير'}</div>
  </header>
);

interface UserData {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  balance?: number;
  avatar_url?: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isSubAgent, setIsSubAgent] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded = jwtDecode<UserData>(token);
        setUserData(decoded);
        if (decoded.role === 'agent') {
          checkIfSubAgent(decoded.id);
        }
        fetchUserBalance(decoded.id);
      } catch {}
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [activeFilter]);

  const getHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  async function checkIfSubAgent(userId: string) {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/agent/is-sub-agent?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setIsSubAgent(data.isSubAgent);
    } catch {}
  }

  async function fetchUserBalance(userId: string) {
    try {
      const res = await fetch(`/api/wallet?userId=${userId}`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok && data.balance !== undefined) {
        setUserData(prev => prev ? { ...prev, balance: data.balance } : prev);
      }
    } catch {}
  }

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories', { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) setCategories(data.categories || []);
    } catch {}
  }

  async function fetchProducts() {
    setLoading(true);
    try {
      const url = activeFilter === 'all'
        ? '/api/products?limit=100'
        : `/api/products?category=${activeFilter}&limit=100`;
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) setProducts(data.products || []);
    } catch (error) {
      console.error('فشل جلب المنتجات:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUserData(null);
    toast.success('تم تسجيل الخروج');
    router.push('/sign-up-login-screen');
  };

  // ترتيب وتصفية المنتجات
  let filtered = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );
  if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);

  const filterTabs = [
    { id: 'all', label: 'الكل' },
    ...categories.map(c => ({ id: c.id, label: `${c.icon || '📁'} ${c.name_ar || c.name}` }))
  ];

  // المحتوى الرئيسي (المنتجات + الفلاتر)
  const mainContent = (
    <div className="space-y-6">
      <ProductBanner />
      <TickerBar />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">المنتجات</h1>
        <div className="flex flex-wrap gap-2">
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full pr-10 py-2.5 rounded-xl bg-dark-100 border border-gray-700 text-white text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl bg-dark-100 border border-gray-700 text-white text-sm"
          >
            <option value="default">الافتراضي</option>
            <option value="price-asc">السعر: من الأقل إلى الأعلى</option>
            <option value="price-desc">السعر: من الأعلى إلى الأقل</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeFilter === tab.id ? 'bg-cyan-600 text-white' : 'bg-dark-100 text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white">لا توجد منتجات</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(product => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 block"
              style={{ background: 'rgba(17,17,40,0.9)', border: '1px solid rgba(12,113,178,0.2)' }}
            >
              <div className="h-40 flex items-center justify-center text-6xl bg-cyan-600/10">
                {product.image || product.emoji || '📦'}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-white">{product.name}</h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-black text-white">${product.price}</span>
                  <span className="flex items-center gap-1 text-xs text-cyan-400">
                    <Zap size={12} /> {product.delivery_time || 'فوري'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  // إذا لم يكن المستخدم مسجلاً -> عرض شريط جانبي للزائر فقط، بدون Topbar
  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800" dir="rtl">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-80 flex-shrink-0">
              <div className="sticky top-6 rounded-2xl bg-dark-100 border border-gray-800 p-6 text-center">
                <div className="text-5xl mb-4">👤</div>
                <h3 className="text-xl font-bold text-white mb-2">مرحباً بك</h3>
                <p className="text-gray-400 text-sm mb-6">سجل دخولك للاستمتاع بتجربة شراء أفضل</p>
                <Link href="/sign-up-login-screen" className="block w-full py-3 rounded-xl bg-cyan-600 text-white font-bold text-center mb-3">
                  تسجيل الدخول
                </Link>
                <Link href="/sign-up-login-screen?tab=signup" className="block w-full py-3 rounded-xl bg-gray-800 text-white font-bold text-center">
                  إنشاء حساب جديد
                </Link>
              </div>
            </aside>
            <main className="flex-1 min-w-0">{mainContent}</main>
          </div>
        </div>
      </div>
    );
  }

  // تحديد المكونات حسب الدور
  let SidebarComponent;
  let TopbarComponent;
  let sidebarProps = { userData };
  let topbarProps: any = { userData };

  switch (userData.role) {
    case 'admin':
    case 'super_admin':
      SidebarComponent = DashboardSidebar;
      TopbarComponent = AdminTopbar; // أو أي مكون علوي للمدير
      break;
    case 'agent':
      SidebarComponent = AgentSidebar;
      TopbarComponent = AgentTopbar;
      topbarProps = { userData, isSubAgent, onNavigateToVip: () => {} }; // يمكن إضافة التنقل
      break;
    default: // customer
      SidebarComponent = CustomerSidebar;
      TopbarComponent = CustomerTopbar;
      break;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0A0A14' }} dir="rtl">
      <SidebarComponent {...sidebarProps} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopbarComponent {...topbarProps} />
        <main className="flex-1 overflow-y-auto p-6">{mainContent}</main>
      </div>
    </div>
  );
}