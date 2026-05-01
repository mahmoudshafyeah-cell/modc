// src/app/products/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Search, Grid3x3, LayoutList, ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: string;
  image_url: string;
  link_url: string;
  sort_order: number;
}

interface TickerMessage {
  id: string;
  text: string;
  speed: number;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  image_url?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  stock?: number;
}

export default function ProductsPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
    fetchTicker();
    fetchCategories();
    fetchProducts();
  }, []);

  async function fetchBanners() {
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    setBanners(data || []);
  }

  async function fetchTicker() {
    const { data } = await supabase
      .from('ticker')
      .select('*')
      .eq('is_active', true);
    setTickerMessages(data || []);
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
  }

  async function fetchProducts() {
    setLoading(true);
    let query = supabase.from('products').select('*');
    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory);
    }
    const { data } = await query;
    setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // عرض الشريط الإخباري (ماركيز)
  const tickerText = tickerMessages.map(m => m.text).join(' • ');

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* الشريط الإخباري */}
      {tickerText && (
        <div className="bg-cyan-600/10 border-b border-cyan-500/20 py-2 overflow-hidden">
          <div
            className="whitespace-nowrap animate-marquee"
            style={{ animationDuration: '30s' }}
          >
            <span className="text-cyan-300 text-sm mx-4">{tickerText}</span>
          </div>
        </div>
      )}

      {/* البانرات (سلايدر بسيط) */}
      {banners.length > 0 && (
        <div className="container mx-auto px-4 py-6">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 scrollbar-hide">
              {banners.map(banner => (
                <a
                  key={banner.id}
                  href={banner.link_url || '#'}
                  target={banner.link_url ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="snap-start shrink-0 w-full md:w-1/2 lg:w-1/3"
                >
                  <img src={banner.image_url} alt="بانر" className="w-full h-48 object-cover rounded-xl" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white text-center mb-8">منتجاتنا</h1>

        {/* الفئات */}
        {categories.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${!selectedCategory ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                الكل
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedCategory === cat.id ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* شريط البحث والتحكم */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 bg-gray-800/50 p-4 rounded-xl">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-cyan-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400'}`}><Grid3x3 size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400'}`}><LayoutList size={18} /></button>
          </div>
        </div>

        {/* المنتجات */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد منتجات</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Link href={`/products/${product.id}`} key={product.id} className="group bg-gray-800 rounded-2xl overflow-hidden hover:scale-105 transition duration-300">
                <div className="h-48 bg-gray-700 flex items-center justify-center">
                  {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : <Package size={48} className="text-gray-500" />}
                </div>
                <div className="p-4 text-right">
                  <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-cyan-400 font-bold">${product.price}</span>
                    <button className="px-4 py-1.5 rounded-lg bg-cyan-600 text-white text-sm hover:bg-cyan-700 transition">شراء</button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map(product => (
              <Link href={`/products/${product.id}`} key={product.id} className="block bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">{product.image_url ? <img src={product.image_url} className="h-full w-full object-cover rounded-lg" /> : <Package size={24} className="text-gray-500" />}</div>
                  <div className="flex-1 text-right"><h3 className="text-white font-bold">{product.name}</h3><p className="text-gray-400 text-sm">{product.description}</p></div>
                  <div className="text-left"><span className="text-cyan-400 font-bold">${product.price}</span><button className="block mt-1 px-3 py-1 rounded-lg bg-cyan-600 text-white text-xs">شراء</button></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}