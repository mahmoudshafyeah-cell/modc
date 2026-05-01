'use client';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [type, setType] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userId, setUserId] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url = new URL('/api/admin/reports', window.location.origin);
      url.searchParams.set('type', type);
      if (startDate) url.searchParams.set('start', startDate);
      if (endDate) url.searchParams.set('end', endDate);
      if (userId) url.searchParams.set('userId', userId);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'فشل التقرير');
      setData(result.transactions || []);
      toast.success('تم إنشاء التقرير');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (data.length === 0) return;
    let csv = 'المبلغ,النوع,التاريخ,المستخدم\n';
    data.forEach((tx: any) => {
      csv += `${tx.amount},${tx.type},${new Date(tx.created_at).toLocaleDateString('ar')},${tx.profiles?.full_name || ''}\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report_${type}_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold text-white mb-6">التقارير</h1>
      <div className="bg-dark-100 p-6 rounded-xl border border-gray-700 space-y-4">
        <div className="flex gap-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="p-2 rounded bg-dark-50 border border-gray-600 text-white"
          >
            <option value="daily">يومي</option>
            <option value="weekly">أسبوعي</option>
            <option value="custom">مخصص (من - إلى)</option>
          </select>

          {type === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-2 rounded bg-dark-50 border border-gray-600 text-white"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-2 rounded bg-dark-50 border border-gray-600 text-white"
              />
            </div>
          )}

          <input
            type="text"
            placeholder="معرف المستخدم (اختياري)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="p-2 rounded bg-dark-50 border border-gray-600 text-white"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-violet-600 text-white"
          >
            {loading ? 'جاري...' : 'إنشاء التقرير'}
          </button>
          {data.length > 0 && (
            <button onClick={exportCSV} className="px-6 py-2 rounded-xl bg-green-600 text-white">
              تصدير CSV
            </button>
          )}
        </div>
      </div>

      {data.length > 0 && (
        <div className="mt-6 rounded-2xl bg-dark-100 border border-gray-700 overflow-x-auto">
          <table className="w-full text-right">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-4 text-gray-400">المستخدم</th>
                <th className="p-4 text-gray-400">النوع</th>
                <th className="p-4 text-gray-400">المبلغ</th>
                <th className="p-4 text-gray-400">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {data.map((tx: any) => (
                <tr key={tx.id} className="border-b border-gray-800">
                  <td className="p-4 text-white">{tx.profiles?.full_name || '—'}</td>
                  <td className="p-4 text-white">{tx.type}</td>
                  <td className="p-4 text-white">${tx.amount}</td>
                  <td className="p-4 text-white">{new Date(tx.created_at).toLocaleString('ar-SY')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}