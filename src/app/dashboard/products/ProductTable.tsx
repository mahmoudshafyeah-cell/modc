'use client';
import { Edit2, Trash2 } from 'lucide-react';

interface ProductTableProps {
  products: any[];
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
}

export default function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  return (
    <div className="rounded-2xl bg-dark-100 border border-violet-500/20 overflow-x-auto">
      <table className="w-full text-right">
        <thead className="border-b border-gray-700">
          <tr>
            <th className="p-4 text-gray-400">المنتج</th>
            <th className="p-4 text-gray-400">الفئة</th>
            <th className="p-4 text-gray-400">السعر</th>
            <th className="p-4 text-gray-400">المخزون</th>
            <th className="p-4 text-gray-400">الحالة</th>
            <th className="p-4 text-gray-400">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id} className="border-b border-gray-800">
              <td className="p-4 text-white">{product.name}</td>
              <td className="p-4 text-gray-300">{product.category || '-'}</td>
              <td className="p-4 text-white">${product.price}</td>
              <td className="p-4 text-white">{product.stock}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-lg text-xs ${product.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                  {product.is_active ? 'نشط' : 'معطل'}
                </span>
              </td>
              <td className="p-4">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(product)} className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => onDelete(product.id)} className="p-1.5 rounded-lg bg-red-600/20 text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && <p className="p-4 text-gray-400 text-center">لا توجد منتجات</p>}
    </div>
  );
}