'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function BundlesPage() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [bundleName, setBundleName] = useState('');
  const [bundleDesc, setBundleDesc] = useState('');
  const [bundlePrice, setBundlePrice] = useState('');
  const [bundleAssets, setBundleAssets] = useState<any[]>([]);

  useEffect(() => { fetchBundles(); fetchAvailableAssets(); }, []);

  async function fetchBundles() {
    const { data } = await supabase.from('bundles').select('*');
    setBundles(data || []);
  }

  async function fetchAvailableAssets() {
    const { data } = await supabase.from('assets').select('id, product_id, type').eq('status', 'available');
    setAssets(data || []);
  }

  async function createBundle(e: React.FormEvent) {
    e.preventDefault();
    if (!bundleName.trim()) return toast.error('الاسم مطلوب');
    const { data } = await supabase.from('bundles').insert({ name: bundleName, description: bundleDesc, price: parseFloat(bundlePrice) || null }).select().single();
    toast.success('تم إنشاء الحزمة');
    setBundleName(''); setBundleDesc(''); setBundlePrice(''); setShowForm(false);
    fetchBundles();
  }

  async function selectBundle(bundle: any) {
    setSelectedBundle(bundle);
    const { data } = await supabase.from('bundle_assets').select('*, assets(*)').eq('bundle_id', bundle.id);
    setBundleAssets(data || []);
  }

  async function addAssetToBundle(assetId: string) {
    if (!selectedBundle) return;
    await supabase.from('bundle_assets').insert({ bundle_id: selectedBundle.id, asset_id: assetId });
    toast.success('تمت إضافة الأصل');
    selectBundle(selectedBundle);
  }

  async function removeAssetFromBundle(assetId: string) {
    if (!selectedBundle) return;
    await supabase.from('bundle_assets').delete().eq('bundle_id', selectedBundle.id).eq('asset_id', assetId);
    toast.success('تمت الإزالة');
    selectBundle(selectedBundle);
  }

  async function deleteBundle(id: string) {
    if (!confirm('حذف الحزمة؟')) return;
    await supabase.from('bundles').delete().eq('id', id);
    toast.success('تم الحذف');
    setSelectedBundle(null);
    fetchBundles();
  }

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold text-white">الحزم</h1>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold"><Plus size={16} /> حزمة جديدة</button>
        </div>
        {showForm && (
          <form onSubmit={createBundle} className="bg-dark-100 p-6 rounded-xl border border-gray-800 space-y-4">
            <input type="text" placeholder="اسم الحزمة" value={bundleName} onChange={e=>setBundleName(e.target.value)} required className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
            <input type="text" placeholder="الوصف" value={bundleDesc} onChange={e=>setBundleDesc(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
            <input type="number" step="0.01" placeholder="السعر (اختياري)" value={bundlePrice} onChange={e=>setBundlePrice(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
            <button type="submit" className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">إنشاء</button>
          </form>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-100 rounded-xl border border-gray-800 p-4">
            <h2 className="text-lg font-bold text-white mb-3">الحزم المتاحة</h2>
            {bundles.map(b=>(
              <div key={b.id} onClick={()=>selectBundle(b)} className={`p-3 rounded-lg cursor-pointer mb-2 ${selectedBundle?.id===b.id ? 'bg-cyan-600/30 border-r-4 border-cyan-400' : 'bg-gray-800 hover:bg-gray-700'}`}>
                <p className="text-white font-bold">{b.name}</p>
                <p className="text-gray-400 text-sm">{b.price ? `$${b.price}` : ''}</p>
              </div>
            ))}
          </div>
          {selectedBundle && (
            <div className="col-span-2 bg-dark-100 rounded-xl border border-gray-800 p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-white">محتويات {selectedBundle.name}</h2>
                <button onClick={()=>deleteBundle(selectedBundle.id)} className="text-red-400 text-sm">حذف الحزمة</button>
              </div>
              <ul className="mb-4 space-y-2">
                {bundleAssets.map(ba=>(
                  <li key={ba.asset_id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                    <span>{ba.assets?.product_id} ({ba.assets?.type})</span>
                    <button onClick={()=>removeAssetFromBundle(ba.asset_id)} className="text-red-400 text-xs">إزالة</button>
                  </li>
                ))}
              </ul>
              <select onChange={e=>addAssetToBundle(e.target.value)} defaultValue="" className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700">
                <option value="" disabled>أضف أصلاً متاحاً</option>
                {assets.filter(a=>!bundleAssets.some(ba=>ba.asset_id===a.id)).map(a=>(
                  <option key={a.id} value={a.id}>{a.product_id} ({a.type})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}