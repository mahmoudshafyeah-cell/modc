'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Send } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

interface Ticket {
  id: string;
  user_id: string;
  user_email: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  created_at: string;
}

interface Reply {
  id: string;
  ticket_id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('فشل جلب التذاكر');
    else setTickets(data || []);
    setLoading(false);
  }

  async function fetchReplies(ticketId: string) {
    const { data } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setReplies(data || []);
  }

  const selectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchReplies(ticket.id);
  };

  async function sendReply() {
    if (!replyMessage.trim() || !selectedTicket) return;
    const { error } = await supabase.from('ticket_replies').insert({
      ticket_id: selectedTicket.id,
      message: replyMessage,
      is_staff: true,
    });
    if (error) toast.error('فشل إرسال الرد');
    else {
      toast.success('تم إرسال الرد');
      setReplyMessage('');
      fetchReplies(selectedTicket.id);
    }
  }

  async function updateTicketStatus(ticketId: string, status: string) {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status })
      .eq('id', ticketId);
    if (error) toast.error('فشل تحديث الحالة');
    else {
      toast.success('تم تحديث الحالة');
      fetchTickets();
      if (selectedTicket?.id === ticketId) setSelectedTicket({ ...selectedTicket, status: status as any });
    }
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">الدعم الفني (التذاكر)</h1>
          <button onClick={fetchTickets} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600"><RefreshCw size={18} /></button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-dark-100 rounded-xl border border-gray-800 p-4 max-h-[70vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-3">التذاكر</h2>
            {tickets.map(t => (
              <div key={t.id} onClick={() => selectTicket(t)} className={`p-3 rounded-lg cursor-pointer mb-2 ${selectedTicket?.id === t.id ? 'bg-cyan-600/20 border-r-2 border-cyan-400' : 'hover:bg-gray-800'}`}>
                <div className="flex justify-between"><span className="font-bold text-white">{t.subject}</span><span className="text-xs text-gray-400">{t.status}</span></div>
                <p className="text-gray-400 text-sm">{t.user_email}</p>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 bg-dark-100 rounded-xl border border-gray-800 p-4">
            {selectedTicket ? (
              <>
                <div className="border-b border-gray-700 pb-3 mb-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">{selectedTicket.subject}</h2>
                    <select value={selectedTicket.status} onChange={e => updateTicketStatus(selectedTicket.id, e.target.value)} className="p-1 rounded bg-gray-800 text-white border border-gray-700">
                      <option value="open">مفتوحة</option><option value="in_progress">قيد المعالجة</option><option value="closed">مغلقة</option>
                    </select>
                  </div>
                  <p className="text-gray-400 mt-2">{selectedTicket.description}</p>
                  <p className="text-gray-500 text-xs mt-1">من: {selectedTicket.user_email} - {new Date(selectedTicket.created_at).toLocaleString('ar-SY')}</p>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {replies.map(r => (
                    <div key={r.id} className={`p-3 rounded-lg ${r.is_staff ? 'bg-cyan-600/10 border-r-2 border-cyan-400' : 'bg-gray-800'}`}>
                      <div className="flex justify-between"><span className="font-bold text-white">{r.is_staff ? 'الدعم الفني' : 'العميل'}</span><span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString('ar-SY')}</span></div>
                      <p className="text-gray-300 mt-1">{r.message}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <textarea value={replyMessage} onChange={e => setReplyMessage(e.target.value)} placeholder="اكتب ردك..." className="flex-1 p-2 rounded-lg bg-gray-800 text-white border border-gray-700" rows={2}></textarea>
                  <button onClick={sendReply} className="px-4 py-2 rounded-xl bg-cyan-600 text-white flex items-center gap-2"><Send size={16} /> إرسال</button>
                </div>
              </>
            ) : <p className="text-center text-gray-400 py-20">اختر تذكرة من القائمة</p>}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}