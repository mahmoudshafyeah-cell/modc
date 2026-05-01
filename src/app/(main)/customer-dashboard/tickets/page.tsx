'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, MessageCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/user/tickets', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب التذاكر');
      setTickets(data.tickets || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchTickets();
  }, []);

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/user/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, message, priority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء التذكرة');
      toast.success('تم إنشاء التذكرة بنجاح');
      setNewTicketOpen(false);
      setSubject('');
      setMessage('');
      setPriority('normal');
      fetchTickets();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabels: Record<string, string> = {
    open: 'مفتوحة',
    in_progress: 'قيد المعالجة',
    resolved: 'تم الحل',
    closed: 'مغلقة',
  };
  const statusColors: Record<string, string> = {
    open: 'bg-green-600/20 text-green-400',
    in_progress: 'bg-amber-600/20 text-amber-400',
    resolved: 'bg-blue-600/20 text-blue-400',
    closed: 'bg-gray-600/20 text-gray-400',
  };

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">تذاكر الدعم</h1>
        <button onClick={() => setNewTicketOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white">
          <Plus size={16} /> تذكرة جديدة
        </button>
      </div>

      {newTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setNewTicketOpen(false)}>
          <div className="bg-dark-100 rounded-2xl p-6 w-full max-w-md border border-violet-500/30" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">تذكرة جديدة</h3>
            <form onSubmit={createTicket} className="space-y-4">
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="الموضوع" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="وصف المشكلة" rows={4} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white">
                <option value="low">منخفضة</option>
                <option value="normal">عادية</option>
                <option value="high">عالية</option>
                <option value="urgent">عاجلة</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-bold">{submitting ? 'جاري الإرسال...' : 'إرسال'}</button>
                <button type="button" onClick={() => setNewTicketOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-700 text-white">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <p className="text-gray-400 text-center py-8">لا توجد تذاكر</p>
        ) : (
          tickets.map(ticket => (
            <Link key={ticket.id} href={`/customer-dashboard/tickets/${ticket.id}`} className="block p-4 rounded-xl bg-dark-100 border border-gray-700 hover:border-violet-500/30">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">{ticket.subject}</h3>
                <span className={`px-2 py-1 rounded-lg text-xs ${statusColors[ticket.status]}`}>{statusLabels[ticket.status]}</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ticket.created_at).toLocaleDateString('ar-SY')}</span>
                <span className="flex items-center gap-1"><MessageCircle size={12} /> {ticket.ticket_replies?.[0]?.count || 0} ردود</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}