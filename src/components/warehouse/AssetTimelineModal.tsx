'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Clock } from 'lucide-react';

interface AssetTimelineModalProps {
  assetId: string;
  assetName: string;
  onClose: () => void;
}

export default function AssetTimelineModal({ assetId, assetName, onClose }: AssetTimelineModalProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    if (!assetId) return;
    supabase.from('asset_transactions').select('*').eq('asset_id', assetId).order('created_at', { ascending: false }).then(({ data }) => setTransactions(data || []));
    supabase.from('asset_notes').select('*').eq('asset_id', assetId).order('created_at', { ascending: false }).then(({ data }) => setNotes(data || []));
  }, [assetId]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-100 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">سجل الأصل: {assetName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <h4 className="text-md font-semibold text-cyan-400 mb-2">الحركات</h4>
        {transactions.length === 0 ? <p className="text-gray-500 text-sm">لا توجد حركات</p> : (
          <ul className="space-y-2 mb-4">
            {transactions.map(t => (
              <li key={t.id} className="border-b border-gray-700 pb-2 text-sm">
                <span className="text-gray-300">{t.type}</span>: {t.from_user} → {t.to_user}
                <span className="text-gray-500 text-xs mr-2">{new Date(t.created_at).toLocaleString('ar-SY')}</span>
                {t.price && <span className="text-green-400 mr-2">${t.price}</span>}
              </li>
            ))}
          </ul>
        )}
        <h4 className="text-md font-semibold text-cyan-400 mb-2">الملاحظات</h4>
        {notes.length === 0 ? <p className="text-gray-500 text-sm">لا توجد ملاحظات</p> : (
          <ul className="space-y-2">
            {notes.map(n => (
              <li key={n.id} className="border-b border-gray-700 pb-2 text-sm">
                <p className="text-gray-300">{n.note}</p>
                <p className="text-gray-500 text-xs">{n.user_email} - {new Date(n.created_at).toLocaleString('ar-SY')}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}