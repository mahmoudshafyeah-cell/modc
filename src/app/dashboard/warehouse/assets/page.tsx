'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Edit, Trash2, RefreshCw, History, ArrowRightLeft, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';
import TransferAssetModal from '@/components/warehouse/TransferAssetModal';
import AssetTimelineModal from '@/components/warehouse/AssetTimelineModal';

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showTransfer, setShowTransfer] = useState(false);
  const [timelineAsset, setTimelineAsset] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    fetchAssets();
  }, [search, statusFilter]);

  async function fetchAssets() {
    setLoading(true);
    let query = supabase.from('assets').select('*').order('created_at', { ascending: false });
    if (search) query = query.or(`product_id.ilike.%${search}%,owner_id.ilike.%${search}%`);
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data, error } = await query;
    if (error) toast.error('فشل جلب الأصول');
    else setAssets(data || []);
    setLoading(false);
  }

  async function deleteAsset(id: string) {
    if (!confirm('حذف الأصل؟')) return;
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) toast.error('فشل الحذف');
    else { toast.success('تم الحذف'); fetchAssets(); }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === assets.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(assets.map(a => a.id)));
  };

  const statusColors: Record<string,string> = {
    available: 'bg-green-600/20 text-green-400', reserved: 'bg-yellow-600/20 text-yellow-400',
    sold: 'bg-red-600/20 text-red-400', expired: 'bg-gray-600/20 text-gray-400'
  };

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-white">إدارة الأصول</h1>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <button onClick={() => setShowTransfer(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-bold">
                <ArrowRightLeft size={16} /> نقل {selectedIds.size} أصل
              </button>
            )}
            <Link href="/dashboard/warehouse/assets/add" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold">
              <Plus size={16} /> إضافة أصل
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="بحث..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pr-9 py-2 rounded-xl bg-dark-100 border border-gray-700 text-white text-sm" />
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-4 py-2 rounded-xl bg-dark-100 border border-gray-700 text-white text-sm">
            <option value="all">جميع الحالات</option><option value="available">متاح</option><option value="reserved">محجوز</option><option value="sold">مباع</option><option value="expired">منتهي</option>
          </select>
          <button onClick={fetchAssets} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600"><RefreshCw size={18} className="text-gray-300" /></button>
        </div>
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>
        : assets.length===0 ? <div className="text-center py-20 text-gray-400">لا توجد أصول</div>
        : <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-3 w-10"><button onClick={toggleSelectAll}>{selectedIds.size === assets.length ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4 text-gray-400" />}</button></th>
                  <th className="p-3 text-right">المنتج</th><th className="p-3 text-right">النوع</th><th className="p-3 text-right">البيانات</th>
                  <th className="p-3 text-right">الحالة</th><th className="p-3 text-right">المالك</th><th className="p-3 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(a=>(
                  <tr key={a.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-center"><button onClick={()=>toggleSelect(a.id)}>{selectedIds.has(a.id) ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4 text-gray-400" />}</button></td>
                    <td className="p-3 text-gray-300">{a.product_id}</td><td className="p-3 text-gray-300">{a.type}</td>
                    <td className="p-3 text-gray-300 max-w-xs truncate">{JSON.stringify(a.data)}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded-lg text-xs ${statusColors[a.status]}`}>{a.status}</span></td>
                    <td className="p-3 text-gray-300">{a.owner_id}</td>
                    <td className="p-3 flex gap-2">
                      <Link href={`/dashboard/warehouse/assets/${a.id}/edit`} className="text-cyan-400"><Edit size={16} /></Link>
                      <button onClick={()=>deleteAsset(a.id)} className="text-red-400"><Trash2 size={16} /></button>
                      <button onClick={()=>setTimelineAsset({id: a.id, name: a.product_id})} className="text-blue-400"><History size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
      {showTransfer && <TransferAssetModal assetIds={Array.from(selectedIds)} onClose={()=>{setShowTransfer(false); setSelectedIds(new Set());}} onSuccess={fetchAssets} />}
      {timelineAsset && <AssetTimelineModal assetId={timelineAsset.id} assetName={timelineAsset.name} onClose={()=>setTimelineAsset(null)} />}
    </AuthGuard>
  );
}