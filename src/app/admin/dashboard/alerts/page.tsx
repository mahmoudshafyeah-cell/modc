'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AlertThreshold {
  id: string;
  product_id: string;
  min_quantity: number;
}

export default function AlertsPage() {
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState('');
  const [minQty, setMinQty] = useState(5);

  useEffect(() => {
    fetchThresholds();
  }, []);

  async function fetchThresholds() {
    setLoading(true);
    const { data } = await supabase.from('alert_thresholds').select('*');
    setThresholds(data || []);
    setLoading(false);
  }

  async function addThreshold(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return toast.error('معرف المنتج مطلوب');
    const { error } = await supabase.from('alert_thresholds').insert({ product_id: productId, min_quantity: minQty });
    if (error) toast.error('فشل الإضافة');
    else {
      toast.success('تمت الإضافة');
      setProductId('');
      setShowForm(false);
      fetchThresholds();
    }
  }

  async function deleteThreshold(id: string) {
    const { error } = await supabase.from('alert_thresholds').delete().eq('id', id);
    if (error) toast.error('فشل الحذف');
    else {
      toast.success('تم الحذف');
      fetchThresholds();
    }
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">تنبيهات المخزون</h1>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl bg-cyan-600 text-white flex items-center gap-2"><Plus size={16} /> إضافة حد</button>
        </div>
        {showForm && (
          <form onSubmit={addThreshold} className="bg-dark-100 rounded-xl p-6 border border-gray-800 space-y-4">
            <input type="text" placeholder="معرف المنتج" value={productId} onChange={e => setProductId(e.target.value)} required className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
            <input type="number" placeholder="الحد الأدنى للكمية" value={minQty} onChange={e => setMinQty(parseInt(e.target.value) || 5)} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
            <button type="submit" className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">حفظ</button>
          </form>
        )}
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : thresholds.length === 0 ? <div className="text-center py-20 text-gray-400">لا توجد تنبيهات محددة</div> : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700"><tr><th className="p-3 text-right">المنتج</th><th className="p-3 text-right">الحد الأدنى</th><th className="p-3 text-right"></th></tr></thead>
              <tbody>
                {thresholds.map(t => (
                  <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{t.product_id}</td><td className="p-3 text-gray-300">{t.min_quantity}</td>
                    <td className="p-3"><button onClick={() => deleteThreshold(t.id)} className="text-red-400"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}