'use client';
import { useEffect, useState } from 'react';
import { Package, Zap, ShoppingCart, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  image?: string;
  emoji?: string;
  wholesale_price: number;
  price: number;
  stock: number;
  category?: string;
}

export default function AgentProducts({ userData }: { userData: any }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      } else {
        toast.error(data.error || 'فشل جلب المنتجات');
      }
    } catch (error) {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy(productId: string, wholesalePrice: number) {
    setBuyingId(productId);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الشراء');

      toast.success(`تم شراء المنتج بسعر الجملة: $${wholesalePrice.toFixed(2)}`);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBuyingId(null);
    }
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن منتج..."
            className="input-field pr-9 text-right text-sm h-10"
          />
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-black text-white">منتجات الجملة</h1>
          <p className="text-sm text-gray-400">شراء المنتجات بسعر الجملة للبيع لعملائك</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">لا توجد منتجات جملة متاحة</h3>
          <p className="text-gray-400">لم يقم المدير بإضافة منتجات بأسعار جملة بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(product => (
            <div
              key={product.id}
              className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2"
              style={{ background: 'rgba(17,17,40,0.9)', border: '1px solid rgba(0,212,255,0.15)' }}
            >
              <div className="h-40 flex items-center justify-center text-6xl bg-cyan-600/10">
                {product.image || product.emoji || '📦'}
              </div>
              <div className="p-5 text-right">
                <h3 className="font-bold text-white text-base mb-1">{product.name}</h3>
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => handleBuy(product.id, product.wholesale_price)}
                    disabled={buyingId === product.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    {buyingId === product.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ShoppingCart size={14} />
                    )}
                    <span>شراء</span>
                  </button>
                  <div>
                    <p className="text-xs text-gray-400">سعر الجملة</p>
                    <p className="text-lg font-black text-cyan-400">${product.wholesale_price.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 line-through">${product.price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <Zap size={12} className="text-cyan-400" />
                  <span>ربح متوقع: ${(product.price - product.wholesale_price).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}