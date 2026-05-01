// src/app/products/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Zap, Menu, X, User, LogIn, UserPlus, Home, HelpCircle, Facebook, Instagram, Twitter, Phone, Mail, Crown, Star } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';

// مكونات البانر والشريط الإخباري (تأكد من وجودها)
import ProductBanner from './components/ProductBanner';
import TickerBar from './components/TickerBar';

// الشريط الجانبي الخاص بالزوار
function GuestSidebar({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const whatsappNumber = '966512345678'; // استبدل برقم الواتساب الحقيقي من الإعدادات

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">القائمة</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={24} />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-3">
        <Link href="/" className="flex items-center gap-3 p-3 rounded-xl text-gray-300 hover:bg-gray-800 transition">
          <Home size={20} /> الرئيسية
        </Link>
        <Link href="/sign-up-login-screen" className="flex items-center gap-3 p-3 rounded-xl text-gray-300 hover:bg-gray-800 transition">
          <LogIn size={20} /> تسجيل الدخول
        </Link>
        <Link href="/sign-up-login-screen?tab=signup" className="flex items-center gap-3 p-3 rounded-xl text-gray-300 hover:bg-gray-800 transition">
          <UserPlus size={20} /> إنشاء حساب
        </Link>
        <Link href="/legal/about" className="flex items-center gap-3 p-3 rounded-xl text-gray-300 hover:bg-gray-800 transition">
          <HelpCircle size={20} /> من نحن
        </Link>
        <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl text-green-400 hover:bg-gray-800 transition">
          <Phone size={20} /> الدعم الفني (واتساب)
        </a>
      </div>
      <div className="p-4 border-t border-gray-700 text-center text-gray-500 text-xs">
        <p>© 2025 MODC - جميع الحقوق محفوظة</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="#" className="hover:text-cyan-400"><Facebook size={16} /></a>
          <a href="#" className="hover:text-cyan-400"><Instagram size={16} /></a>
          <a href="#" className="hover:text-cyan-400"><Twitter size={16} /></a>
        </div>
      </div>
    </div>
  );
}

interface UserData {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  balance?: number;
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded = jwtDecode<UserData>(token);
        setUserData(decoded);
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

  let filtered = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()));
  if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);

  const filterTabs = [
    { id: 'all', label: 'الكل' },
    ...categories.map(c => ({ id: c.id, label: `${c.icon || '📁'} ${c.name_ar || c.name}` }))
  ];

  // المحتوى الرئيسي (المنتجات والفلاتر) مع تصميم جديد
  const mainContent = (
    <div className="space-y-8">
      {/* البانر */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl">
        <ProductBanner />
      </div>

      {/* الشريط الإخباري */}
      <TickerBar />

      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          منتجاتنا
        </h1>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full md:w-64 pr-10 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-white text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="default">الافتراضي</option>
            <option value="price-asc">السعر: من الأقل إلى الأعلى</option>
            <option value="price-desc">السعر: من الأعلى إلى الأقل</option>
          </select>
        </div>
      </div>

      {/* أزرار التصنيفات */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === tab.id
                ? 'bg-cyan-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* عرض المنتجات */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/30 rounded-2xl">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white">لا توجد منتجات</h3>
          <p className="text-gray-400">حاول تغيير معايير البحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(product => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl bg-gray-800/40 backdrop-blur-sm border border-gray-700 hover:border-cyan-500/50"
            >
              <div className="h-48 flex items-center justify-center text-7xl bg-gradient-to-br from-gray-700/50 to-gray-800/50">
                {product.image || product.emoji || '📦'}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-white text-lg group-hover:text-cyan-400 transition">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-2xl font-black text-white">${product.price}</span>
                  <span className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full">
                    <Zap size={12} />
                    {product.delivery_time || 'فوري'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  // إذا كان المستخدم غير مسجل -> عرض شريط جانبي خاص بالزوار
  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" dir="rtl">
        {/* زر فتح القائمة الجانبية */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="fixed top-4 right-4 z-50 p-3 rounded-full bg-gray-800/80 backdrop-blur-sm shadow-lg border border-gray-700 md:hidden"
        >
          <Menu size={24} className="text-white" />
        </button>

        {/* القائمة الجانبية المنبثقة للموبايل */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
            <div className="absolute top-0 right-0 bottom-0 w-80 bg-gray-900 shadow-xl overflow-y-auto border-l border-gray-700">
              <GuestSidebar onClose={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* تخطيط سطح المكتب: شريط جانبي ثابت على اليمين */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="hidden lg:block lg:w-80 flex-shrink-0">
              <div className="sticky top-6 rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 overflow-hidden shadow-xl">
                <GuestSidebar onClose={() => {}} />
              </div>
            </aside>
            <main className="flex-1 min-w-0">
              {mainContent}
            </main>
          </div>
        </div>
      </div>
    );
  }

  // إذا كان المستخدم مسجلاً -> نعرض واجهة حسب دوره (كما في السابق لكن مع تحسين التصميم)
  // يمكن استخدام نفس الـ Sidebars السابقة أو نخصصها بشكل أنيق أيضاً. سنبقيها بسيطة.
  // لكن للاختصار سنعيد استخدام المكونات الموجودة:

  // استيراد المكونات الخاصة بالأدوار
  import DashboardSidebar from '@/app/dashboard/components/DashboardSidebar';
  import AgentSidebar from '@/app/(main)/agent-dashboard/components/AgentSidebar';
  import CustomerSidebar from '@/app/(main)/customer-dashboard/components/DashboardSidebar';
  import AgentTopbar from '@/app/(main)/agent-dashboard/components/AgentTopbar';
  import CustomerTopbar from '@/app/(main)/customer-dashboard/components/DashboardTopbar';

  let SidebarComponent;
  let TopbarComponent;
  let sidebarProps = { userData };
  let topbarProps: any = { userData };

  switch (userData.role) {
    case 'admin':
    case 'super_admin':
      SidebarComponent = DashboardSidebar;
      TopbarComponent = () => null; // لا شريط علوي للمدير
      break;
    case 'agent':
      SidebarComponent = AgentSidebar;
      TopbarComponent = AgentTopbar;
      topbarProps = { userData, isSubAgent: false, onNavigateToVip: () => router.push('/agent-dashboard?tab=vip') };
      break;
    default:
      SidebarComponent = CustomerSidebar;
      TopbarComponent = CustomerTopbar;
      break;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900" dir="rtl">
      <SidebarComponent {...sidebarProps} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopbarComponent {...topbarProps} />
        <main className="flex-1 overflow-y-auto p-6">{mainContent}</main>
      </div>
    </div>
  );
}