'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    fetchTransactions(today, today);
  }, []);

  async function fetchTransactions(start: string, end: string) {
    setLoading(true);
    const startISO = new Date(start).toISOString();
    const endISO = new Date(end + 'T23:59:59').toISOString();
    const { data } = await supabase
      .from('asset_transactions')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false });
    setTransactions(data || []);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchTransactions(startDate, endDate);
  }

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
      'الأصل': t.asset_id, 'من': t.from_user, 'إلى': t.to_user,
      'النوع': t.type, 'السعر': t.price, 'التاريخ': new Date(t.created_at).toLocaleString('ar-SY')
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الحركات');
    XLSX.writeFile(wb, `تقرير_حركات_${startDate}_${endDate}.xlsx`);
    toast.success('تم التصدير');
  }

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text(`تقرير الحركات من ${startDate} إلى ${endDate}`, 14, 10);
    autoTable(doc, {
      head: [['الأصل', 'من', 'إلى', 'النوع', 'السعر', 'التاريخ']],
      body: transactions.map(t => [
        t.asset_id?.slice(0,8), t.from_user, t.to_user, t.type, t.price ? `$${t.price}` : '-', new Date(t.created_at).toLocaleString('ar-SY')
      ]),
      startY: 20,
    });
    doc.save(`تقرير_حركات_${startDate}_${endDate}.pdf`);
    toast.success('تم التصدير');
  }

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <h1 className="text-2xl font-bold text-white">التقارير</h1>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end bg-dark-100 p-6 rounded-xl border border-gray-800">
          <div><label className="block text-white mb-1">من تاريخ</label><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="p-2 rounded bg-gray-800 text-white border border-gray-700" /></div>
          <div><label className="block text-white mb-1">إلى تاريخ</label><input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="p-2 rounded bg-gray-800 text-white border border-gray-700" /></div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold flex items-center gap-2"><RefreshCw size={16} /> عرض</button>
          {transactions.length>0 && <><button type="button" onClick={exportExcel} className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2"><Download size={16} /> Excel</button>
          <button type="button" onClick={exportPDF} className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold flex items-center gap-2"><Download size={16} /> PDF</button></>}
        </form>
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : transactions.length===0 ? <div className="text-center text-gray-400">لا توجد حركات في هذه الفترة</div> :
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700"><tr><th className="p-3 text-right">الأصل</th><th className="p-3 text-right">من</th><th className="p-3 text-right">إلى</th><th className="p-3 text-right">النوع</th><th className="p-3 text-right">السعر</th><th className="p-3 text-right">التاريخ</th></tr></thead>
              <tbody>
                {transactions.map(t=>(
                  <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{t.asset_id?.slice(0,8)}</td><td className="p-3 text-gray-300">{t.from_user}</td><td className="p-3 text-gray-300">{t.to_user}</td>
                    <td className="p-3 text-gray-300">{t.type}</td><td className="p-3 text-gray-300">{t.price ? `$${t.price}` : '-'}</td>
                    <td className="p-3 text-gray-300">{new Date(t.created_at).toLocaleString('ar-SY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </AuthGuard>
  );
}