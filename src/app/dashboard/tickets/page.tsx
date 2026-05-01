'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = new URL('/api/admin/tickets', window.location.origin);
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets(data.tickets);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const statusLabels: Record<string, string> = {
    open: 'مفتوحة',
    in_progress: 'قيد المعالجة',
    resolved: 'تم الحل',
    closed: 'مغلقة',
  };

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold text-white mb-6">إدارة التذاكر</h1>
      <div className="flex gap-2 mb-4">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg ${statusFilter === s ? 'bg-violet-600 text-white' : 'bg-dark-100 text-gray-400'}`}
          >
            {s === 'all' ? 'الكل' : statusLabels[s]}
          </button>
        ))}
      </div>
      <div className="rounded-2xl bg-dark-100 border border-gray-700 overflow-x-auto">
        <table className="w-full text-right">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-4 text-gray-400">المستخدم</th>
              <th className="p-4 text-gray-400">الموضوع</th>
              <th className="p-4 text-gray-400">الحالة</th>
              <th className="p-4 text-gray-400">التاريخ</th>
              <th className="p-4 text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket.id} className="border-b border-gray-800">
                <td className="p-4 text-white">{ticket.profiles?.full_name || ticket.profiles?.email}</td>
                <td className="p-4 text-white">{ticket.subject}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-lg text-xs ${
                    ticket.status === 'open' ? 'bg-green-600/20 text-green-400' :
                    ticket.status === 'in_progress' ? 'bg-amber-600/20 text-amber-400' :
                    'bg-gray-600/20 text-gray-400'
                  }`}>{statusLabels[ticket.status]}</span>
                </td>
                <td className="p-4 text-gray-300">{new Date(ticket.created_at).toLocaleDateString('ar-SY')}</td>
                <td className="p-4">
                  <Link href={`/dashboard/tickets/${ticket.id}`} className="text-violet-400 hover:underline">عرض</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tickets.length === 0 && <p className="p-4 text-gray-400 text-center">لا توجد تذاكر</p>}
      </div>
    </div>
  );
}