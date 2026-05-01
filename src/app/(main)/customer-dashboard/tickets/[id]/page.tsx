'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Send, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [ticket, setTicket] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/user/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب التذكرة');
      setTicket(data.ticket);
      setReplies(data.replies || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [id]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/user/tickets/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال الرد');
      setMessage('');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;
  if (!ticket) return <div className="p-6 text-red-400">التذكرة غير موجودة</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto" dir="rtl">
      <Link href="/customer-dashboard/tickets" className="inline-flex items-center gap-1 text-violet-400 mb-4">
        <ArrowRight size={16} /> العودة للتذاكر
      </Link>
      <div className="bg-dark-100 p-6 rounded-xl border border-gray-700 mb-6">
        <h1 className="text-xl font-bold text-white mb-2">{ticket.subject}</h1>
        <p className="text-gray-400 text-sm">تم الإنشاء: {new Date(ticket.created_at).toLocaleString('ar-SY')}</p>
      </div>

      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {replies.map((reply) => (
          <div key={reply.id} className={`p-4 rounded-xl ${reply.is_staff ? 'bg-violet-600/10 border border-violet-500/30 mr-8' : 'bg-dark-50 border border-gray-700 ml-8'}`}>
            <p className="text-white">{reply.message}</p>
            <p className="text-xs text-gray-400 mt-2">
              {reply.profiles?.full_name || 'مستخدم'} - {new Date(reply.created_at).toLocaleString('ar-SY')}
            </p>
          </div>
        ))}
      </div>

      {ticket.status !== 'closed' && (
        <form onSubmit={sendReply} className="flex gap-2">
          <input value={message} onChange={e => setMessage(e.target.value)} placeholder="اكتب ردك..." className="flex-1 p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
          <button type="submit" disabled={sending} className="px-4 py-3 rounded-xl bg-violet-600 text-white"><Send size={18} /></button>
        </form>
      )}
    </div>
  );
}