'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Save, Download, Upload, AlertTriangle } from 'lucide-react';

export default function WarehouseSettingsPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [defaultWarehouse, setDefaultWarehouse] = useState(localStorage.getItem('warehouse_default') || '');
  const [backupFile, setBackupFile] = useState<File | null>(null);

  useEffect(() => {
    supabase.from('warehouses').select('id,name').then(({data}) => setWarehouses(data||[]));
  }, []);

  const saveSettings = () => {
    localStorage.setItem('warehouse_default', defaultWarehouse);
    toast.success('تم حفظ الإعدادات');
  };

  const exportBackup = async () => {
    const tables = ['assets', 'asset_transactions', 'products', 'warehouses', 'external_providers', 'orders'];
    const backup: any = {};
    for (const table of tables) {
      const { data } = await supabase.from(table).select('*');
      backup[table] = data;
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warehouse_backup_${new Date().toISOString()}.json`;
    a.click();
    toast.success('تم تصدير النسخة الاحتياطية');
  };

  const importBackup = async () => {
    if (!backupFile) return toast.error('اختر ملفاً أولاً');
    const text = await backupFile.text();
    try {
      const backup = JSON.parse(text);
      if (!confirm('سيتم استبدال جميع البيانات الحالية. متابعة؟')) return;
      for (const table of Object.keys(backup)) {
        if (backup[table]?.length) {
          await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from(table).insert(backup[table]);
        }
      }
      toast.success('تم استعادة النسخة الاحتياطية');
    } catch {
      toast.error('ملف غير صالح');
    }
  };

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white">إعدادات المستودع</h1>
        <div className="bg-dark-100 p-6 rounded-xl border border-gray-800 space-y-6">
          <div>
            <label className="block text-white mb-2">المستودع الافتراضي للمزامنة</label>
            <select value={defaultWarehouse} onChange={e=>setDefaultWarehouse(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700">
              <option value="">بدون</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <button onClick={saveSettings} className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold flex items-center justify-center gap-2"><Save size={16} /> حفظ الإعدادات</button>
        </div>
        <div className="bg-dark-100 p-6 rounded-xl border border-gray-800 space-y-4">
          <h2 className="text-lg font-bold text-white">النسخ الاحتياطي</h2>
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-red-400 text-sm flex items-start gap-2"><AlertTriangle size={18} className="mt-0.5" /> تحذير: استيراد نسخة احتياطية سيحذف البيانات الحالية.</div>
          <div className="flex gap-3 flex-wrap"><button onClick={exportBackup} className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2"><Download size={16} /> تصدير</button>
            <label className="px-4 py-2 rounded-xl bg-yellow-600 text-white font-bold flex items-center gap-2 cursor-pointer"><Upload size={16} /> استيراد<input type="file" accept=".json" onChange={e=>setBackupFile(e.target.files?.[0]||null)} className="hidden" /></label>
            {backupFile && <button onClick={importBackup} className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold">تأكيد الاستيراد</button>}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}