'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { X, Upload } from 'lucide-react';
import { createAuthenticatedClient } from '@/lib/supabase';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: any | null;
}

export default function ProductForm({ open, onClose, onSuccess, initialData }: ProductFormProps) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    badge: '',
    price: '',
    original_price: '',
    stock: '0',
    delivery_time: 'فوري',
    delivery_type: 'instant',
    is_active: true,
    has_codes: false,
    wholesale_price: '',
    wholesale_only: false,
    is_variable_quantity: false,
    min_quantity: '',
    max_quantity: '',
    player_required: false,
    is_direct_provider: false,
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        description: initialData.description || '',
        category_id: initialData.category_id || '',
        badge: initialData.badge || '',
        price: initialData.price?.toString() || '',
        original_price: initialData.original_price?.toString() || '',
        stock: initialData.stock?.toString() || '0',
        delivery_time: initialData.delivery_time || 'فوري',
        delivery_type: initialData.delivery_type || 'instant',
        is_active: initialData.is_active ?? true,
        has_codes: initialData.has_codes || false,
        wholesale_price: initialData.wholesale_price?.toString() || '',
        wholesale_only: initialData.wholesale_only || false,
        is_variable_quantity: initialData.is_variable_quantity || false,
        min_quantity: initialData.min_quantity?.toString() || '',
        max_quantity: initialData.max_quantity?.toString() || '',
        player_required: initialData.player_required || false,
        is_direct_provider: initialData.is_direct_provider || false,
      });
      setImagePreview(initialData.image_url || null);
    } else {
      setForm({
        name: '', description: '', category_id: '', badge: '', price: '',
        original_price: '', stock: '0', delivery_time: 'فوري', delivery_type: 'instant',
        is_active: true, has_codes: false, wholesale_price: '', wholesale_only: false,
        is_variable_quantity: false, min_quantity: '', max_quantity: '',
        player_required: false, is_direct_provider: false,
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setCsvFile(null);
  }, [initialData, open]);

  async function fetchCategories() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setCategories(data.categories || []);
    } catch {}
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return initialData?.image_url || null;
    const supabase = createAuthenticatedClient();
    const fileName = `products/${Date.now()}-${imageFile.name}`;
    const { error: uploadError } = await supabase.storage.from('products').upload(fileName, imageFile);
    if (uploadError) { toast.error('فشل رفع الصورة: ' + uploadError.message); return null; }
    const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const method = initialData ? 'PUT' : 'POST';
      const imageUrl = await uploadImage();
      if (imageFile && !imageUrl) { setLoading(false); return; }

      const payload = {
        name: form.name,
        description: form.description,
        category_id: form.category_id || null,
        badge: form.badge || null,
        price: parseFloat(form.price) || 0,
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        stock: parseInt(form.stock) || 0,
        delivery_time: form.delivery_time,
        delivery_type: form.delivery_type,
        is_active: form.is_active,
        has_codes: form.has_codes,
        wholesale_price: form.wholesale_price ? parseFloat(form.wholesale_price) : null,
        wholesale_only: form.wholesale_only,
        is_variable_quantity: form.is_variable_quantity,
        min_quantity: form.min_quantity ? parseInt(form.min_quantity) : null,
        max_quantity: form.max_quantity ? parseInt(form.max_quantity) : null,
        player_required: form.player_required,
        is_direct_provider: form.is_direct_provider,
        image_url: imageUrl || initialData?.image_url || null,
        ...(initialData ? { id: initialData.id } : {}),
      };

      const res = await fetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (form.has_codes && csvFile) {
        const productId = data.product?.id || initialData?.id;
        if (productId) await uploadCodes(productId);
      }

      toast.success(initialData ? 'تم التحديث' : 'تمت الإضافة');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally { setLoading(false); }
  }

  async function uploadCodes(productId: string) {
    if (!csvFile) return;
    const text = await csvFile.text();
    const codes = text.split('\n').map(l => l.trim()).filter(c => c.length > 0);
    if (codes.length === 0) return toast.error('ملف CSV فارغ');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/products/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, codes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`تم رفع ${codes.length} كود`);
    } catch (error: any) {
      toast.error('فشل رفع الأكواد: ' + error.message);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-dark-100 rounded-2xl p-6 w-full max-w-md border border-violet-500/30 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-gray-400"><X size={20} /></button>
          <h3 className="text-lg font-bold text-white">{initialData ? 'تعديل منتج' : 'إضافة منتج'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* صورة المنتج */}
          <div>
            <label className="block text-white mb-2">صورة المنتج</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-700">
                <img src={imagePreview} alt="معاينة" className="w-full max-h-40 object-cover" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-red-600/80 text-white"><X size={14} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="w-full py-8 rounded-xl bg-dark-50 border border-dashed border-gray-600 text-gray-400 flex flex-col items-center gap-2"><Upload size={24} />اضغط لرفع صورة المنتج</button>
            )}
          </div>

          {/* الحقول الأساسية */}
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم المنتج" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="الوصف" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" rows={2} />
          <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white">
            <option value="">اختر الفئة</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
          </select>
          <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} type="number" step="0.01" placeholder="السعر" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
          <input value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })} type="number" step="0.01" placeholder="السعر الأصلي" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />

          {/* سعر الجملة */}
          <div>
            <label className="block text-white mb-2">سعر الجملة للوكلاء (اختياري)</label>
            <input type="number" step="0.01" value={form.wholesale_price} onChange={e => setForm({ ...form, wholesale_price: e.target.value })} placeholder="سعر الجملة ($)" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
          </div>

          {/* المخزون والتسليم */}
          <input value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} type="number" placeholder="المخزون" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
          <input value={form.delivery_time} onChange={e => setForm({ ...form, delivery_time: e.target.value })} placeholder="وقت التسليم" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />

          {/* خيارات التفعيل */}
          <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />منتج نشط</label>
          <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={form.has_codes} onChange={e => setForm({ ...form, has_codes: e.target.checked })} />منتج بأكواد مخزنة (بطاقات)</label>
          {form.has_codes && (
            <div><label className="block text-white mb-2">ملف الأكواد (CSV)</label><input ref={csvRef} type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" /></div>
          )}

          {/* منتجات متغيرة الكمية */}
          <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={form.is_variable_quantity} onChange={e => setForm({ ...form, is_variable_quantity: e.target.checked })} />منتج بكمية متغيرة</label>
          {form.is_variable_quantity && (
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: e.target.value })} placeholder="الحد الأدنى" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
              <input type="number" value={form.max_quantity} onChange={e => setForm({ ...form, max_quantity: e.target.value })} placeholder="الحد الأقصى" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
            </div>
          )}

          {/* خيارات إضافية */}
          <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={form.player_required} onChange={e => setForm({ ...form, player_required: e.target.checked })} />يتطلب ID لاعب</label>
          <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={form.is_direct_provider} onChange={e => setForm({ ...form, is_direct_provider: e.target.checked })} />شحن مباشر من مورد خارجي</label>
          <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={form.wholesale_only} onChange={e => setForm({ ...form, wholesale_only: e.target.checked })} />متاح للوكلاء فقط (منتج جملة)</label>

          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold">{loading ? 'جاري الحفظ...' : initialData ? 'تحديث' : 'إضافة'}</button>
        </form>
      </div>
    </div>
  );
}