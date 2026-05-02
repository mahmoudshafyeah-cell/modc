'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreditLimit {
  id: string;
  agent_id: string;
  agent_email: string;
  credit_limit: number;
  used: number;
  created_at: string;
}

export default function AgentCreditsPage() {
  const [credits, setCredits] = useState<CreditLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ agent_id: '', credit_limit: 0 });

  useEffect(() => {
    fetchCredits();
  }, []);

  async function fetchCredits() {
    setLoading(true);
    const { data, error } = await supabase
      .from('agent_credits')
      .select('*, agents:agent_id(email)')
      .order('created_at', { ascending: false });
    if (error) toast.error('فشل جلب حدود الائتمان');
    else {
      const formatted = (data || []).map(c => ({ ...c, agent_email: c.agents?.email || c.agent_id }));
      setCredits(formatted);
    }
    setLoading(false);
  }

  async function addCredit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.agent_id || form.credit_limit <= 0) return toast.error('البيانات غير صحيحة');
    const { error } = await supabase.from('agent_credits').insert({
      agent_id: form.agent_id,
      credit_limit: form.credit_limit,
    });
    if (error) toast.error('فشل الإضافة');
    else {
      toast.success('تم إضافة حد الائتمان');
      setShowForm(false);
      setForm({ agent_id: '', credit_limit: 0 });
      fetchCredits();
    }
  }

  async function deleteCredit(id: string) {
    if (!confirm('حذف هذا الحد؟')) return;
    const { error } = await supabase.from('agent_credits').delete().eq('id', id);
    if (error) toast.error('فشل الحذف');
    else {
      toast.success('تم الحذف');
      fetchCredits();
    }
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">حدود ائتمان الوكلاء</h1>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl bg-cyan-600 text-white flex items-center gap-2"><Plus size={16} /> إضافة حد</button>
        </div>
        {showForm && (
          <form onSubmit={addCredit} className="bg-dark-100 rounded-xl p-6 border border-gray-800 space-y-4">
            <input type="text" placeholder="معرف الوكيل (البريد الإلكتروني أو UUID)" value={form.agent_id} onChange={e => setForm({ ...form, agent_id: e.target.value })} required className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
            <input type="number" placeholder="حد الائتمان ($)" value={form.credit_limit} onChange={e => setForm({ ...form, credit_limit: parseFloat(e.target.value) || 0 })} required className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
            <button type="submit" className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">حفظ</button>
          </form>
        )}
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : credits.length === 0 ? <div className="text-center py-20 text-gray-400">لا توجد حدود ائتمان</div> : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700"><tr><th className="p-3 text-right">الوكيل</th><th className="p-3 text-right">الحد</th><th className="p-3 text-right">المستخدم</th><th className="p-3 text-right">تاريخ التعيين</th><th className="p-3 text-right"></th></tr></thead>
              <tbody>
                {credits.map(c => (
                  <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{c.agent_email}</td><td className="p-3 text-gray-300">${c.credit_limit}</td><td className="p-3 text-gray-300">${c.used}</td>
                    <td className="p-3 text-gray-300">{new Date(c.created_at).toLocaleDateString('ar-SY')}</td>
                    <td className="p-3"><button onClick={() => deleteCredit(c.id)} className="text-red-400"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}