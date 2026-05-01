// src/app/dashboard/CommissionManager.tsx
'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Percent, Save, Search } from 'lucide-react';

interface Agent {
  id: string;
  email: string;
  full_name: string;
  commission_rate: number;
}

export default function CommissionManager() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAgents(); }, []);

  async function fetchAgents() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/agent-commissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setAgents(data.agents || []);
    } catch { toast.error('فشل جلب الوكلاء'); }
    finally { setLoading(false); }
  }

  async function saveCommission(agentId: string) {
    if (!editRate || parseFloat(editRate) < 0 || parseFloat(editRate) > 100) {
      toast.error('نسبة غير صالحة (0-100)');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/agent-commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sub_agent_id: agentId, commission_rate: parseFloat(editRate) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم حفظ نسبة العمولة');
      setEditingId(null);
      fetchAgents();
    } catch (error: any) { toast.error(error.message); }
    finally { setSaving(false); }
  }

  const filtered = agents.filter(a => !search || a.full_name?.includes(search) || a.email?.includes(search));

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">نسب عمولات الوكلاء الفرعيين</h2>
        <div className="relative w-64">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="input-field pr-9 text-right text-sm h-10" />
        </div>
      </div>

      <div className="rounded-2xl bg-dark-100 border border-gray-700 overflow-x-auto">
        <table className="w-full text-right">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-4 text-gray-400">الوكيل</th>
              <th className="p-4 text-gray-400">البريد</th>
              <th className="p-4 text-gray-400">نسبة العمولة الحالية</th>
              <th className="p-4 text-gray-400">تعديل</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(agent => (
              <tr key={agent.id} className="border-b border-gray-800">
                <td className="p-4 text-white font-medium">{agent.full_name || '—'}</td>
                <td className="p-4 text-gray-400 text-sm">{agent.email}</td>
                <td className="p-4">
                  <span className="text-green-400 font-bold">{agent.commission_rate || 2}%</span>
                </td>
                <td className="p-4">
                  {editingId === agent.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" value={editRate} onChange={e => setEditRate(e.target.value)} className="w-16 p-1.5 rounded bg-dark-50 border border-gray-600 text-white text-center" min="0" max="100" />
                      <button onClick={() => saveCommission(agent.id)} disabled={saving} className="p-1.5 rounded-lg bg-green-600/20 text-green-400"><Save size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-gray-600/20 text-gray-400">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingId(agent.id); setEditRate((agent.commission_rate || 2).toString()); }} className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400 text-sm">تعديل</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}