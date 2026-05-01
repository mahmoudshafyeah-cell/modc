'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TransferAssetModalProps {
  assetIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferAssetModal({ assetIds, onClose, onSuccess }: TransferAssetModalProps) {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [targetWarehouseId, setTargetWarehouseId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('warehouses').select('id, name').then(({ data }) => setWarehouses(data || []));
  }, []);

  const handleTransfer = async () => {
    if (!targetWarehouseId) return toast.error('اختر المستودع الهدف');
    setLoading(true);
    const { error } = await supabase
      .from('assets')
      .update({ warehouse_id: targetWarehouseId })
      .in('id', assetIds);
    if (error) toast.error('فشل النقل: ' + error.message);
    else {
      // تسجيل الحركات
      const transactions = assetIds.map(assetId => ({
        asset_id: assetId,
        from_user: 'system',
        to_user: targetWarehouseId,
        type: 'warehouse_transfer',
        details: `نقل إلى مستودع ${targetWarehouseId}`,
      }));
      await supabase.from('asset_transactions').insert(transactions);
      toast.success(`تم نقل ${assetIds.length} أصل`);
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-dark-100 rounded-2xl p-6 w-96 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">نقل {assetIds.length} أصل</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <select
          value={targetWarehouseId}
          onChange={e => setTargetWarehouseId(e.target.value)}
          className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 mb-4"
        >
          <option value="">اختر المستودع الهدف</option>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <button
          onClick={handleTransfer}
          disabled={loading}
          className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'تأكيد النقل'}
        </button>
      </div>
    </div>
  );
}