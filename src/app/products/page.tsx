// src/app/products/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { Search, Zap, Menu, X, Home, HelpCircle, LogIn, UserPlus, Phone } from 'lucide-react';

// مكونات الصفحة العامة
import ProductBanner from './components/ProductBanner';
import TickerBar from './components/TickerBar';

// مكونات الأدوار (يتم استيرادها مرة واحدة في الأعلى)
import DashboardSidebar from '@/app/dashboard/components/DashboardSidebar'; // للمدير
import AgentSidebar from '@/app/(main)/agent-dashboard/components/AgentSidebar';
import CustomerSidebar from '@/app/(main)/customer-dashboard/components/DashboardSidebar';
import AgentTopbar from '@/app/(main)/agent-dashboard/components/AgentTopbar';
import CustomerTopbar from '@/app/(main)/customer-dashboard/components/DashboardTopbar';

// مكون Topbar بسيط للمدير في صفحة المنتجات
const AdminTopbar = ({ userData }: { userData: any }) => (
  <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-dark-100/50 backdrop-blur-sm">
    <div></div>
    <div className="text-white font-medium">مرحباً {userData?.full_name || userData?.email?.split('@')[0] || 'مدير'}</div>
  </header>
);

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
  const [isSubAgent, setIsSubAgent] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // استخراج التوكن والمستخدم
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

  // تصفية وترتيب
  let filtered = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()));
  if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);

  const filterTabs = [
    { id: 'all', label: 'الكل' },
    ...categories.map(c => ({ id: c.id, label: `${c.icon || '📁'} ${c.name_ar || c.name}` }))
  ];

  // محتوى المنتجات الرئيسي (مستخدم عبر جميع الأدوار)
  const mainContent = (
    <div className="space-y-8">
      <ProductBanner />
      <TickerBar />

      {/* رأس الصفحة مع بحث وترتيب */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          منتجاتنا
        </h1>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-64 pr-9 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-white text-sm focus:border-cyan-500 transition"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700 text-white text-sm focus:border-cyan-500"
          >
            <option value="default">الافتراضي</option>
            <option value="price-asc">السعر: من الأقل إلى الأعلى</option>
            <option value="price-desc">السعر: من الأعلى إلى الأقل</option>
          </select>
        </div>
      </div>

      {/* أزرار التصنيفات */}
      <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
              activeFilter === tab.id
                ? 'bg-cyan-600 text-white shadow-cyan-500/30'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* شبكة المنتجات */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-800/30 rounded-2xl">
          <div className="text-6xl mb-3">🔍</div>
          <h3 className="text-xl font-bold text-white">لا توجد منتجات</h3>
          <p className="text-gray-400 mt-1">حاول البحث بكلمات مختلفة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
          {filtered.map(product => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-2xl overflow-hidden backdrop-blur-sm border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-cyan-500/10"
            >
              <div className="h-44 flex items-center justify-center text-6xl bg-gradient-to-br from-cyan-900/20 to-blue-900/20 group-hover:scale-105 transition-transform duration-300">
                {product.image || product.emoji || '🎁'}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-white text-lg line-clamp-1">{product.name}</h3>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-2xl font-black text-cyan-400">${product.price}</span>
                    {product.oldPrice && (
                      <span className="text-sm text-gray-500 line-through mr-2">${product.oldPrice}</span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs bg-cyan-500/10 px-2 py-1 rounded-full text-cyan-400">
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

  // إذا لم يكن المستخدم مسجلاً : نعرض شريطاً جانبياً خاصاً للزائر بأزرار جميلة
  if (!userData) {
    const whatsappNumber = localStorage.getItem('p2p_whatsapp') || '963964785125';
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" dir="rtl">
        {/* زر فتح القائمة الجانبية */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="fixed top-5 right-5 z-50 p-2.5 rounded-xl bg-gray-800/80 backdrop-blur-md shadow-lg border border-gray-700 md:hidden"
        >
          <Menu size={22} className="text-white" />
        </button>

        {/* نافذة القائمة الجانبية للموبايل */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
            <div className="absolute top-0 right-0 bottom-0 w-80 bg-gray-900 shadow-2xl border-l border-gray-700 overflow-y-auto">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <span className="text-white font-bold text-lg">القائمة</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-lg bg-gray-800"><X size={18} /></button>
              </div>
              <div className="p-4 space-y-3">
                <Link href="/" className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 text-gray-200 hover:bg-gray-700 transition"><Home size={18} /> الرئيسية</Link>
                <Link href="/sign-up-login-screen" className="flex items-center gap-3 p-3 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 transition"><LogIn size={18} /> تسجيل الدخول</Link>
                <Link href="/sign-up-login-screen?tab=signup" className="flex items-center gap-3 p-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition"><UserPlus size={18} /> إنشاء حساب جديد</Link>
                <Link href="/legal/about" className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 text-gray-200 hover:bg-gray-700 transition"><HelpCircle size={18} /> من نحن</Link>
                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-green-600/20 text-green-400 hover:bg-green-600/30 transition"><Phone size={18} /> الدعم الفني (واتساب)</a>
              </div>
            </div>
          </div>
        )}

        {/* تخطيط الصفحة لغير المسجلين: شريط جانبي ثابت على سطح المكتب */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* الشريط الجانبي للزائر (يظهر على الشاشات الكبيرة) */}
            <aside className="hidden lg:block lg:w-80 flex-shrink-0">
              <div className="sticky top-24 rounded-2xl bg-gray-800/40 backdrop-blur-md border border-gray-700/50 shadow-xl overflow-hidden">
                <div className="p-6 text-center border-b border-gray-700/50">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">M</div>
                  <h3 className="text-xl font-bold text-white mt-3">مرحباً بك</h3>
                  <p className="text-gray-400 text-sm mt-1">سجل دخولك للاستمتاع بتجربة شراء أفضل</p>
                </div>
                <div className="p-5 space-y-3">
                  <Link href="/sign-up-login-screen" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition"><LogIn size={18} /> تسجيل الدخول</Link>
                  <Link href="/sign-up-login-screen?tab=signup" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-700 text-white font-bold hover:bg-gray-600 transition"><UserPlus size={18} /> إنشاء حساب جديد</Link>
                  <Link href="/legal/about" className="flex items-center gap-3 p-3 rounded-xl text-gray-300 hover:bg-gray-800 transition"><HelpCircle size={18} /> من نحن</Link>
                  <Link href="/" className="flex items-center gap-3 p-3 rounded-xl text-gray-300 hover:bg-gray-800 transition"><Home size={18} /> الصفحة الرئيسية</Link>
                  <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl text-green-400 hover:bg-green-900/20 transition"><Phone size={18} /> الدعم الفني (واتساب)</a>
                </div>
                <div className="p-4 text-center text-xs text-gray-500 border-t border-gray-700/50">
                  تابعنا على فيسبوك
                </div>
              </div>
            </aside>

            {/* المحتوى الرئيسي */}
            <main className="flex-1 min-w-0">
              {mainContent}
            </main>
          </div>
        </div>
      </div>
    );
  }

  // اختيار المكونات حسب دور المستخدم (للمسجلين)
  let SidebarComponent;
  let TopbarComponent;
  let sidebarProps: any = { userData };
  let topbarProps: any = { userData };

  switch (userData.role) {
    case 'admin':
    case 'super_admin':
      SidebarComponent = DashboardSidebar;
      TopbarComponent = AdminTopbar;
      break;
    case 'agent':
      SidebarComponent = AgentSidebar;
      TopbarComponent = AgentTopbar;
      topbarProps = { userData, isSubAgent, onNavigateToVip: () => router.push('/agent-dashboard?tab=vip') };
      break;
    default: // customer
      SidebarComponent = CustomerSidebar;
      TopbarComponent = CustomerTopbar;
      break;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950" dir="rtl">
      <SidebarComponent {...sidebarProps} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopbarComponent {...topbarProps} />
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-900 to-gray-950">
          {mainContent}
        </main>
      </div>
    </div>
  );
}