'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, CheckSquare, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Provider {
  id: string;
  name: string;
  type: string;
  data: any;
  warehouse_id?: string;
}

interface FetchProviderProductsModalProps {
  provider: Provider;
  onClose: () => void;
}

export default function FetchProviderProductsModal({ provider, onClose }: FetchProviderProductsModalProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchRemoteProducts();
  }, []);

  const fetchRemoteProducts = async () => {
    setLoading(true);
    try {
      const { api_endpoint, api_token } = provider.data || {};
      if (!api_endpoint || !api_token) {
        toast.error('بيانات API غير مكتملة');
        setLoading(false);
        return;
      }

      // استخدام proxy لتجاوز CORS (نفس logic تطبيق Windows)
      const response = await fetch('/api/provider/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: api_endpoint,
          token: api_token,
          path: '/client/api/products'
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'فشل جلب المنتجات');

      const list = Array.isArray(data) ? data : (data.products || []);
      setProducts(list);
      if (list.length > 0) toast.success(`تم جلب ${list.length} منتج`);
      else toast.info('لا توجد منتجات متاحة من هذا المورد');
    } catch (e: any) {
      toast.error('فشل جلب المنتجات: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const importSelected = async () => {
    const selected = products.filter(p => selectedIds.has(p.id));
    if (selected.length === 0) {
      toast.error('لم تختر أي منتج');
      return;
    }

    setImporting(true);
    let importedCount = 0;
    let assetsCount = 0;

    // المستودع الخاص بالمورد (إذا لم يكن موجوداً، نستخدم warehouse_id من provider أو ننشئه)
    let warehouseId = provider.warehouse_id;
    if (!warehouseId) {
      const { data: wh } = await supabase
        .from('warehouses')
        .select('id')
        .eq('name', provider.name)
        .single();
      warehouseId = wh?.id;
    }

    for (const p of selected) {
      // إدراج المنتج (إذا لم يكن موجوداً مسبقاً)
      const { data: newProduct, error: prodErr } = await supabase
        .from('products')
        .upsert({
          name: p.name,
          description: p.category_name || '',
          price: p.price || 0,
          is_direct_provider: true,
          provider_id: provider.id,
          warehouse_id: warehouseId || null,
          image_url: p.category_img || '',
        }, { onConflict: 'name' })
        .select('id')
        .single();

      if (prodErr) {
        console.error('فشل استيراد المنتج:', p.name, prodErr.message);
        continue;
      }

      importedCount++;

      // إدراج أصل (asset) مرتبط بالمنتج
      if (newProduct?.id) {
        const { error: assetErr } = await supabase
          .from('assets')
          .insert({
            product_id: newProduct.id,
            type: 'code',
            data: { provider_product_id: p.id, name: p.name },
            status: 'available',
            owner_id: 'system',
            warehouse_id: warehouseId || null,
            external_provider_id: provider.id,
          });

        if (!assetErr) assetsCount++;
        else console.error('فشل إنشاء الأصل:', assetErr.message);
      }
    }

    if (importedCount === 0) {
      toast.error('لم يتم استيراد أي منتج. تحقق من Console لمزيد من التفاصيل.');
    } else {
      toast.success(`تم استيراد ${importedCount} منتج و ${assetsCount} أصل`);
    }
    setImporting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative dark:text-white">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-4 text-modc-dark dark:text-white">منتجات {provider.name}</h2>

        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-modc-purple" />
            <p className="mt-2">جارٍ التحميل...</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-2">
              <button
                onClick={importSelected}
                disabled={importing || selectedIds.size === 0}
                className="bg-modc-purple text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {importing ? 'جارٍ...' : `استيراد ${selectedIds.size} منتج`}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-modc-purple text-white">
                  <tr>
                    <th className="p-2 w-10">
                      <button onClick={toggleAll}>
                        {selectedIds.size === products.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th className="p-2 text-right">الاسم</th>
                    <th className="p-2 text-right">السعر</th>
                    <th className="p-2 text-right">الفئة</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b dark:border-gray-600">
                      <td className="p-2 text-center">
                        <button onClick={() => toggleSelect(p.id)}>
                          {selectedIds.has(p.id) ? <CheckSquare className="w-4 h-4 text-modc-purple" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="p-2">{p.name}</td>
                      <td className="p-2">{p.price}</td>
                      <td className="p-2">{p.category_name}</td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={4} className="text-center p-4 text-gray-500">لا توجد منتجات</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}