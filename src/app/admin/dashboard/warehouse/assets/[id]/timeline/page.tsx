'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, RefreshCw } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

export default function AssetTimelinePage() {
  const { id } = useParams();
  const [asset, setAsset] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    const { data: assetData } = await supabase.from('assets').select('*').eq('id', id).single();
    setAsset(assetData);

    const { data: txData } = await supabase
      .from('asset_transactions')
      .select('*')
      .eq('asset_id', id)
      .order('created_at', { ascending: false });
    setTransactions(txData || []);

    const { data: noteData } = await supabase
      .from('asset_notes')
      .select('*')
      .eq('asset_id', id)
      .order('created_at', { ascending: false });
    setNotes(noteData || []);

    setLoading(false);
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div>;
  if (!asset) return <div className="text-center text-gray-400">الأصل غير موجود</div>;

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/warehouse/assets" className="text-cyan-400 hover:underline flex items-center gap-1"><ArrowRight size={16} /> العودة</Link>
          <h1 className="text-2xl font-bold text-white">سجل الأصل: {asset.product_id}</h1>
          <button onClick={fetchData} className="p-2 rounded bg-gray-700"><RefreshCw size={16} className="text-gray-300" /></button>
        </div>

        <div className="bg-dark-100 rounded-xl p-5 border border-gray-800 space-y-2">
          <p><span className="text-gray-400">النوع:</span> {asset.type}</p>
          <p><span className="text-gray-400">الحالة:</span> <span className={`px-2 py-0.5 rounded text-xs ${asset.status==='available'?'bg-green-600/20 text-green-400':asset.status==='sold'?'bg-red-600/20 text-red-400':'bg-yellow-600/20 text-yellow-400'}`}>{asset.status}</span></p>
          <p><span className="text-gray-400">المالك:</span> {asset.owner_id}</p>
          <p><span className="text-gray-400">البيانات:</span> <pre className="bg-gray-800 p-2 rounded text-xs overflow-auto">{JSON.stringify(asset.data, null, 2)}</pre></p>
        </div>

        <div className="bg-dark-100 rounded-xl p-5 border border-gray-800">
          <h2 className="text-lg font-bold text-white mb-3">الحركات</h2>
          {transactions.length===0 && <p className="text-gray-400">لا توجد حركات</p>}
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="border-b border-gray-700 pb-2 flex justify-between text-sm">
                <span>{new Date(tx.created_at).toLocaleString('ar-SY')}</span>
                <span><span className="text-cyan-400">{tx.type}</span> من {tx.from_user} إلى {tx.to_user}</span>
                {tx.price && <span className="text-green-400">${tx.price}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-dark-100 rounded-xl p-5 border border-gray-800">
          <h2 className="text-lg font-bold text-white mb-3">ملاحظات</h2>
          {notes.length===0 && <p className="text-gray-400">لا توجد ملاحظات</p>}
          <div className="space-y-2">
            {notes.map(n => (
              <div key={n.id} className="border-b border-gray-700 pb-2 text-sm">
                <div className="text-gray-300">{n.note}</div>
                <div className="text-xs text-gray-500">{n.user_email} - {new Date(n.created_at).toLocaleString('ar-SY')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}