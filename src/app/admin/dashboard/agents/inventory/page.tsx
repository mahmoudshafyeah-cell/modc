'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Asset {
  id: string;
  product_id: string;
  type: string;
  data: any;
  status: string;
  created_at: string;
}

export default function AgentInventoryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('owner_id', user.data.user?.email)
      .eq('status', 'available');
    if (error) toast.error('فشل جلب المخزون');
    else setAssets(data || []);
    setLoading(false);
  }

  async function sellAsset(asset: Asset) {
    if (!customerEmail) {
      toast.error('يرجى إدخال بريد العميل');
      return;
    }
    const { error } = await supabase
      .from('assets')
      .update({ owner_id: customerEmail, status: 'sold' })
      .eq('id', asset.id);
    if (error) toast.error('فشل البيع');
    else {
      toast.success('تم بيع الأصل');
      setSelectedAsset(null);
      setCustomerEmail('');
      fetchInventory();
    }
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">مخزون الوكيل</h1>
          <button onClick={fetchInventory} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600">
            <RefreshCw size={18} className="text-gray-300" />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div>
        ) : assets.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد أصول متاحة</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map(asset => (
              <div key={asset.id} className="bg-dark-100 rounded-xl p-4 border border-gray-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-bold">{asset.product_id}</h3>
                    <p className="text-gray-400 text-sm">{asset.type}</p>
                    <p className="text-gray-500 text-xs mt-1">البيانات: {JSON.stringify(asset.data).slice(0, 50)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedAsset(asset)}
                    className="px-3 py-1 rounded-lg bg-cyan-600 text-white text-sm"
                  >
                    بيع
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedAsset && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-dark-100 rounded-2xl p-6 w-96 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">بيع الأصل</h3>
              <p className="text-gray-300 mb-2">المنتج: {selectedAsset.product_id}</p>
              <input
                type="email"
                placeholder="بريد العميل"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 mb-4"
              />
              <div className="flex gap-2">
                <button onClick={() => sellAsset(selectedAsset)} className="flex-1 py-2 rounded-xl bg-green-600 text-white font-bold">تأكيد البيع</button>
                <button onClick={() => setSelectedAsset(null)} className="flex-1 py-2 rounded-xl bg-gray-700 text-white">إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}