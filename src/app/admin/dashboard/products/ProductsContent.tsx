'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, Power, Key } from 'lucide-react';
import Link from 'next/link';
import ProductForm from './ProductForm';

export default function ProductsContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب المنتجات');
      setProducts(data.products || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف المنتج؟')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      toast.success('تم الحذف');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, is_active: !current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحديث');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">إدارة المنتجات</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700"
        >
          <Plus size={16} /> إضافة منتج
        </button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن منتج..."
          className="w-full md:w-80 pr-10 py-2.5 rounded-xl bg-dark-100 border border-gray-700 text-white"
        />
      </div>

      <div className="rounded-2xl bg-dark-100 border border-gray-700 overflow-x-auto">
        <table className="w-full text-right">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-4 text-gray-400">المنتج</th>
              <th className="p-4 text-gray-400">الفئة</th>
              <th className="p-4 text-gray-400">السعر</th>
              <th className="p-4 text-gray-400">المخزون</th>
              <th className="p-4 text-gray-400">الحالة</th>
              <th className="p-4 text-gray-400">أكواد</th>
              <th className="p-4 text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => (
              <tr key={product.id} className="border-b border-gray-800">
                <td className="p-4 text-white">{product.name}</td>
                <td className="p-4 text-gray-300">{product.categories?.name_ar || '-'}</td>
                <td className="p-4 text-white">${product.price}</td>
                <td className="p-4 text-white">{product.stock}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-lg text-xs ${product.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                    {product.is_active ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td className="p-4">
                  {product.has_codes ? (
                    <Link
                      href={`/dashboard/products/${product.id}/codes`}
                      className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 text-sm"
                    >
                      <Key size={14} />
                      إدارة الأكواد
                    </Link>
                  ) : (
                    <span className="text-gray-500 text-sm">-</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(product)} className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleToggle(product.id, product.is_active)} className={`p-1.5 rounded-lg ${product.is_active ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                      <Power size={14} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg bg-red-600/20 text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-4 text-gray-400 text-center">لا توجد منتجات</p>}
      </div>

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          fetchProducts();
        }}
        initialData={editingProduct}
      />
    </div>
  );
}