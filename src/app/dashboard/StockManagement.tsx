'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
  is_active: boolean;
  has_codes: boolean;
}

export default function StockManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', stock: 0, price: 0, has_codes: true });

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

  async function updateStock(productId: string, newStock: number) {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: productId, stock: newStock }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تحديث المخزون');
      toast.success('تم تحديث المخزون');
      setEditingId(null);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function deleteProduct(productId: string) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/products?id=${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حذف المنتج');
      toast.success('تم الحذف');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function addProduct() {
    if (!newProduct.name || newProduct.price <= 0) {
      toast.error('يرجى إدخال اسم وسعر صحيحين');
      return;
    }
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProduct.name,
          stock: newProduct.stock,
          price: newProduct.price,
          is_active: true,
          has_codes: newProduct.has_codes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إضافة المنتج');
      toast.success('تم إضافة المنتج');
      setShowAddModal(false);
      setNewProduct({ name: '', stock: 0, price: 0, has_codes: true });
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">إدارة المخزون</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700"
        >
          <Plus size={16} />
          إضافة منتج
        </button>
      </div>

      <div className="rounded-2xl bg-dark-100 border border-gray-700 overflow-x-auto">
        <table className="w-full text-right">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-4 text-gray-400">المنتج</th>
              <th className="p-4 text-gray-400">السعر</th>
              <th className="p-4 text-gray-400">المخزون الحالي</th>
              <th className="p-4 text-gray-400">نوع المخزون</th>
              <th className="p-4 text-gray-400">تعديل المخزون</th>
              <th className="p-4 text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-gray-800">
                <td className="p-4 text-white font-medium">{product.name}</td>
                <td className="p-4 text-white">${product.price}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    product.stock > 10
                      ? 'bg-green-600/20 text-green-400'
                      : product.stock > 0
                        ? 'bg-amber-600/20 text-amber-400'
                        : 'bg-red-600/20 text-red-400'
                  }`}>
                    {product.stock}
                  </span>
                </td>
                <td className="p-4 text-gray-300">
                  {product.has_codes ? 'بطاقات / أكواد' : 'خدمة'}
                </td>
                <td className="p-4">
                  {editingId === product.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editStock}
                        onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                        className="w-20 p-2 rounded bg-dark-50 border border-gray-600 text-white text-center"
                        autoFocus
                      />
                      <button
                        onClick={() => updateStock(product.id, editStock)}
                        className="p-1.5 rounded-lg bg-green-600/20 text-green-400"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg bg-gray-600/20 text-gray-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(product.id);
                        setEditStock(product.stock);
                      }}
                      className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="p-1.5 rounded-lg bg-red-600/20 text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="p-4 text-gray-400 text-center">لا توجد منتجات</p>
        )}
      </div>

      {/* نافذة إضافة منتج */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowAddModal(false)}>
          <div
            className="bg-dark-100 rounded-2xl p-6 w-full max-w-md border border-violet-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">إضافة منتج جديد</h3>
            <div className="space-y-4">
              <input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="اسم المنتج"
                className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
              />
              <input
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                placeholder="السعر ($)"
                className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
              />
              <input
                type="number"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                placeholder="المخزون الأولي"
                className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
              />
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={newProduct.has_codes}
                  onChange={(e) => setNewProduct({ ...newProduct, has_codes: e.target.checked })}
                />
                منتج بأكواد (بطاقات)
              </label>
              <div className="flex gap-2">
                <button onClick={addProduct} className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-bold">
                  إضافة
                </button>
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl bg-gray-700 text-white">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}