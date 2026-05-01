'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

interface AgentCommission {
  id: string;
  agent_id: string;
  agent_email: string;
  commission_rate: number;
  updated_at: string;
}

export default function AgentCommissionsPage() {
  const [commissions, setCommissions] = useState<AgentCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState('');

  useEffect(() => {
    fetchCommissions();
  }, []);

  async function fetchCommissions() {
    setLoading(true);
    const { data, error } = await supabase
      .from('agent_commissions')
      .select('*, agents:agent_id(email)')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('فشل جلب العمولات');
    } else {
      const formatted = (data || []).map(c => ({ ...c, agent_email: c.agents?.email || c.agent_id }));
      setCommissions(formatted);
    }
    setLoading(false);
  }

  async function updateCommission(id: string, rate: number) {
    const { error } = await supabase
      .from('agent_commissions')
      .update({ commission_rate: rate, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error('فشل التحديث');
    else {
      toast.success('تم تحديث العمولة');
      fetchCommissions();
    }
    setEditingId(null);
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">عمولات الوكلاء</h1>
          <button onClick={fetchCommissions} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600">
            <RefreshCw size={18} className="text-gray-300" />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div>
        ) : commissions.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد عمولات محددة</div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-3 text-right">الوكيل</th>
                  <th className="p-3 text-right">نسبة العمولة (%)</th>
                  <th className="p-3 text-right">آخر تحديث</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => (
                  <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{c.agent_email}</td>
                    <td className="p-3">
                      {editingId === c.id ? (
                        <div className="flex gap-1">
                          <input type="number" step="0.1" value={editRate} onChange={e => setEditRate(e.target.value)} className="w-20 p-1 rounded bg-gray-800 text-white border border-gray-700" />
                          <button onClick={() => updateCommission(c.id, parseFloat(editRate))} className="text-green-400"><Save size={16} /></button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400"><X size={16} /></button>
                        </div>
                      ) : (
                        <span className="text-cyan-400 font-bold">{c.commission_rate}%</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-300">{new Date(c.updated_at).toLocaleDateString('ar-SY')}</td>
                    <td className="p-3">
                      {editingId !== c.id && (
                        <button onClick={() => { setEditingId(c.id); setEditRate(c.commission_rate.toString()); }} className="text-cyan-400"><Edit size={16} /></button>
                      )}
                    </td>
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