'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, Plus, Upload, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ProductCodesPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [product, setProduct] = useState<any>(null);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all');

  useEffect(() => {
    if (!id) return;
    fetchProduct();
    fetchCodes();
  }, [id]);

  async function fetchProduct() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/products?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setProduct(data.product);
    } catch (error) {
      console.error('فشل جلب المنتج:', error);
    }
  }

  async function fetchCodes() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/products/${id}/codes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setCodes(data.codes || []);
    } catch (error) {
      toast.error('فشل جلب الأكواد');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSingle() {
    if (!newCode.trim()) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/products/${id}/codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ codes: [newCode.trim()] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم إضافة الكود');
      setNewCode('');
      setShowAdd(false);
      fetchCodes();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleUploadCSV() {
    if (!csvFile) return;
    setUploading(true);
    try {
      const text = await csvFile.text();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) throw new Error('ملف CSV فارغ');

      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/products/${id}/codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ codes: lines })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`تم رفع ${lines.length} كود`);
      setCsvFile(null);
      fetchCodes();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(codeId: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الكود؟')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/products/${id}/codes?codeId=${codeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم الحذف');
      fetchCodes();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const filtered = codes.filter(c => {
    if (filter === 'used') return c.is_used;
    if (filter === 'unused') return !c.is_used;
    return true;
  });

  if (loading) {
    return (
      <div className="p-6 text-gray-400">جاري التحميل...</div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/products" className="text-gray-400 hover:text-white">
            <ArrowRight size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white">
            أكواد المنتج: {product?.name || '...'}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white"
          >
            <Plus size={16} /> إضافة كود
          </button>
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white cursor-pointer">
            <Upload size={16} /> رفع CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => setCsvFile(e.target.files?.[0] || null)}
            />
          </label>
          {csvFile && (
            <button
              onClick={handleUploadCSV}
              disabled={uploading}
              className="px-4 py-2 rounded-xl bg-green-600 text-white"
            >
              {uploading ? 'جاري...' : 'رفع'}
            </button>
          )}
        </div>
      </div>

      {/* فلتر */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'الكل' },
          { value: 'unused', label: 'غير مستعملة' },
          { value: 'used', label: 'مستعملة' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as any)}
            className={`px-4 py-2 rounded-xl text-sm ${
              filter === f.value
                ? 'bg-violet-600 text-white'
                : 'bg-dark-100 text-gray-400'
            }`}
          >
            {f.label} ({f.value === 'all' ? codes.length : codes.filter(c => f.value === 'unused' ? !c.is_used : c.is_used).length})
          </button>
        ))}
      </div>

      {/* نافذة إضافة كود منفرد */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-dark-100 rounded-2xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">إضافة كود جديد</h3>
            <input
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              placeholder="أدخل الكود"
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddSingle}
                className="flex-1 py-3 rounded-xl bg-violet-600 text-white"
              >
                إضافة
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-white"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* جدول الأكواد */}
      <div className="rounded-2xl bg-dark-100 border border-gray-700 overflow-x-auto">
        <table className="w-full text-right">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-4 text-gray-400">الكود</th>
              <th className="p-4 text-gray-400">الحالة</th>
              <th className="p-4 text-gray-400">المستخدم</th>
              <th className="p-4 text-gray-400">تاريخ الاستخدام</th>
              <th className="p-4 text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-800">
                <td className="p-4 font-mono text-white">{c.code}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-lg text-xs ${
                    c.is_used
                      ? 'bg-green-600/20 text-green-400'
                      : 'bg-yellow-600/20 text-yellow-400'
                  }`}>
                    {c.is_used ? 'مستعمل' : 'متاح'}
                  </span>
                </td>
                <td className="p-4 text-gray-300">{c.profiles?.email || '-'}</td>
                <td className="p-4 text-gray-300">
                  {c.used_at ? new Date(c.used_at).toLocaleString('ar-SY') : '-'}
                </td>
                <td className="p-4">
                  {!c.is_used && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-lg bg-red-600/20 text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-4 text-gray-400 text-center">لا توجد أكواد</p>
        )}
      </div>
    </div>
  );
}