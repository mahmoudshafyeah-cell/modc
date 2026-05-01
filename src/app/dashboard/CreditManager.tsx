// المسار: src/app/dashboard/CreditManager.tsx
'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search, Save, Wallet, CreditCard, AlertCircle } from 'lucide-react';

interface AgentCredit {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_email: string;
  credit_limit: number;
  used_credit: number;
  status: string;
}

export default function CreditManager() {
  const [agents, setAgents] = useState<any[]>([]);
  const [credits, setCredits] = useState<Record<string, AgentCredit>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAgentsAndCredits();
  }, []);

  async function fetchAgentsAndCredits() {
    try {
      const token = localStorage.getItem('auth_token');
      const [agentsRes, creditsRes] = await Promise.all([
        fetch('/api/admin/users?role=agent', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/agent-credits', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const agentsData = await agentsRes.json();
      const creditsData = await creditsRes.json();

      if (agentsRes.ok) setAgents(agentsData.users || []);
      if (creditsRes.ok) {
        const map: Record<string, AgentCredit> = {};
        (creditsData.credits || []).forEach((c: any) => {
          map[c.agent_id] = c;
        });
        setCredits(map);
      }
    } catch (error) {
      toast.error('فشل جلب البيانات');
    } finally {
      setLoading(false);
    }
  }

  async function saveCredit(agentId: string) {
    if (!editLimit || parseFloat(editLimit) < 0) {
      toast.error('حد ائتمان غير صالح');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/agent-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agent_id: agentId, credit_limit: parseFloat(editLimit) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم حفظ حد الائتمان');
      setEditingId(null);
      fetchAgentsAndCredits();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  const filtered = agents.filter(a =>
    !search || a.full_name?.includes(search) || a.email?.includes(search)
  );

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">إدارة الائتمان</h2>
        <div className="relative w-64">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن وكيل..." className="input-field pr-9 text-right text-sm h-10" />
        </div>
      </div>

      <div className="rounded-2xl bg-dark-100 border border-gray-700 overflow-x-auto">
        <table className="w-full text-right">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-4 text-gray-400">الوكيل</th>
              <th className="p-4 text-gray-400">الحد الائتماني</th>
              <th className="p-4 text-gray-400">المستخدم</th>
              <th className="p-4 text-gray-400">المتاح</th>
              <th className="p-4 text-gray-400">تعديل</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((agent: any) => {
              const credit = credits[agent.id];
              const limit = credit?.credit_limit || 0;
              const used = credit?.used_credit || 0;
              const available = limit - used;

              return (
                <tr key={agent.id} className="border-b border-gray-800">
                  <td className="p-4">
                    <p className="text-white font-medium">{agent.full_name || agent.email}</p>
                    <p className="text-gray-500 text-xs">{agent.email}</p>
                  </td>
                  <td className="p-4">
                    {editingId === agent.id ? (
                      <input
                        type="number"
                        value={editLimit}
                        onChange={e => setEditLimit(e.target.value)}
                        className="w-24 p-2 rounded bg-dark-50 border border-gray-600 text-white text-center"
                        autoFocus
                      />
                    ) : (
                      <span className="text-amber-400 font-bold">${limit.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-red-400">${used.toFixed(2)}</span>
                  </td>
                  <td className="p-4">
                    <span className={`font-bold ${available >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${available.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4">
                    {editingId === agent.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => saveCredit(agent.id)} disabled={saving} className="p-1.5 rounded-lg bg-green-600/20 text-green-400">
                          <Save size={14} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-gray-600/20 text-gray-400">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(agent.id); setEditLimit(limit.toString()); }} className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400">
                        <Edit2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-4 text-gray-400 text-center">لا يوجد وكلاء</p>}
      </div>
    </div>
  );
}