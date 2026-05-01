// src/app/products/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Search, Filter, Grid3x3, LayoutList } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon?: string;
  image_url?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category_id: string;
  description: string;
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

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
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // تقسيم الفئات إلى مجموعات من 3 أو 4 حسب الشاشة
  const chunkSize = 4; // يمكن تغييرها إلى 3
  const categoryChunks = [];
  for (let i = 0; i < categories.length; i += chunkSize) {
    categoryChunks.push(categories.slice(i, i + chunkSize));
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* عنوان الصفحة */}
        <h1 className="text-3xl font-bold text-white text-center mb-8">منتجاتنا</h1>

        {/* عرض الفئات على شكل رباعيات/ثلاثيات */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-cyan-400 mb-4 text-right">الفئات</h2>
          <div className="space-y-6">
            {categoryChunks.map((chunk, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {chunk.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                    className={`group p-4 rounded-2xl text-center transition-all duration-300 ${
                      selectedCategory === cat.id
                        ? 'bg-cyan-600 text-white shadow-lg scale-105'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105'
                    }`}
                  >
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-16 h-16 mx-auto mb-2 rounded-full" />
                    ) : (
                      <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-cyan-500/20 flex items-center justify-center text-2xl">
                        {cat.icon || '📁'}
                      </div>
                    )}
                    <span className="font-medium">{cat.name}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="mt-4 text-sm text-cyan-400 hover:text-cyan-300 transition"
            >
              عرض جميع المنتجات
            </button>
          )}
        </div>

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
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400'}`}
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400'}`}
            >
              <LayoutList size={18} />
            </button>
          </div>
        </div>

        {/* عرض المنتجات */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد منتجات</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Link href={`/products/${product.id}`} key={product.id} className="group bg-gray-800 rounded-2xl overflow-hidden hover:scale-105 transition duration-300">
                <div className="h-48 bg-gray-700 flex items-center justify-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package size={48} className="text-gray-500" />
                  )}
                </div>
                <div className="p-4 text-right">
                  <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-cyan-400 font-bold">${product.price}</span>
                    <button className="px-4 py-1.5 rounded-lg bg-cyan-600 text-white text-sm hover:bg-cyan-700 transition">
                      شراء
                    </button>
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
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                    {product.image_url ? <img src={product.image_url} className="h-full w-full object-cover rounded-lg" /> : <Package size={24} className="text-gray-500" />}
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="text-white font-bold">{product.name}</h3>
                    <p className="text-gray-400 text-sm">{product.description}</p>
                  </div>
                  <div className="text-left">
                    <span className="text-cyan-400 font-bold">${product.price}</span>
                    <button className="block mt-1 px-3 py-1 rounded-lg bg-cyan-600 text-white text-xs">شراء</button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}