'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

interface TickerMessage {
  id: string;
  text: string;
  speed: number;
  is_active: boolean;
  created_at: string;
}

export default function TickerPage() {
  const [messages, setMessages] = useState<TickerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(30);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchTicker();
  }, []);

  async function fetchTicker() {
    setLoading(true);
    const { data } = await supabase.from('ticker').select('*').order('created_at');
    setMessages(data || []);
    if (data && data.length > 0) {
      setSpeed(data[0].speed || 30);
      setIsActive(data[0].is_active !== false);
    }
    setLoading(false);
  }

  async function addMessage() {
    if (!text.trim()) {
      toast.error('يرجى إدخال نص الرسالة');
      return;
    }
    const { error } = await supabase.from('ticker').insert({ text: text.trim(), speed, is_active: isActive });
    if (error) toast.error('فشل الإضافة');
    else {
      toast.success('تمت إضافة الرسالة');
      setText('');
      fetchTicker();
    }
  }

  async function deleteMessage(id: string) {
    const { error } = await supabase.from('ticker').delete().eq('id', id);
    if (error) toast.error('فشل الحذف');
    else {
      toast.success('تم الحذف');
      fetchTicker();
    }
  }

  async function updateSettings() {
    for (const msg of messages) {
      await supabase.from('ticker').update({ speed, is_active: isActive }).eq('id', msg.id);
    }
    toast.success('تم حفظ الإعدادات');
    fetchTicker();
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">الشريط الإخباري</h1>
          <button onClick={fetchTicker} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600">
            <RefreshCw size={18} className="text-gray-300" />
          </button>
        </div>

        <div className="bg-dark-100 rounded-xl p-6 border border-gray-800 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-400 mb-1">سرعة الحركة (كلما قل الرقم كان أسرع)</label>
              <input
                type="number"
                min="5"
                max="100"
                value={speed}
                onChange={e => setSpeed(parseInt(e.target.value) || 30)}
                className="w-24 p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
              />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm text-gray-300">الشريط نشط</span>
            </label>
            <button onClick={updateSettings} className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold flex items-center gap-2">
              <Save size={16} /> حفظ الإعدادات
            </button>
          </div>
        </div>

        <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="نص الرسالة"
              value={text}
              onChange={e => setText(e.target.value)}
              className="flex-1 p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
            />
            <button onClick={addMessage} className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold flex items-center gap-2">
              <Plus size={16} /> إضافة
            </button>
          </div>
          <div className="space-y-2">
            {messages.map(msg => (
              <div key={msg.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-800/50">
                <span className="text-white">{msg.text}</span>
                <button onClick={() => deleteMessage(msg.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {messages.length === 0 && <p className="text-center text-gray-400 py-4">لا توجد رسائل في الشريط الإخباري</p>}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}