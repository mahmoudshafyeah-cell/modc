'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

interface Agent {
  id: string;
  email: string;
  full_name: string;
  role: string;
  balance: number;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
}

export default function AgentsListPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .in('role', ['agent', 'sub_agent']);
    if (error) {
      toast.error('فشل جلب الوكلاء');
      setLoading(false);
      return;
    }

    const agentsWithData = await Promise.all(
      (profiles || []).map(async (agent) => {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', agent.id)
          .single();
        const { data: commission } = await supabase
          .from('agent_commissions')
          .select('commission_rate')
          .eq('agent_id', agent.id)
          .single();
        return {
          ...agent,
          balance: wallet?.balance || 0,
          commission_rate: commission?.commission_rate || 0,
          is_active: true,
        };
      })
    );
    setAgents(agentsWithData);
    setLoading(false);
  }

  const filtered = agents.filter(a =>
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">الوكلاء الفرعيون</h1>
          <button onClick={fetchAgents} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600">
            <RefreshCw size={18} className="text-gray-300" />
          </button>
        </div>
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="بحث بالبريد أو الاسم..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-80 pr-9 py-2 rounded-xl bg-dark-100 border border-gray-700 text-white text-sm"
          />
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا يوجد وكلاء</div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-3 text-right">البريد</th>
                  <th className="p-3 text-right">الاسم</th>
                  <th className="p-3 text-right">الرصيد</th>
                  <th className="p-3 text-right">نسبة العمولة</th>
                  <th className="p-3 text-right">الحالة</th>
                  <th className="p-3 text-right">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{a.email}</td>
                    <td className="p-3 text-gray-300">{a.full_name || '-'}</td>
                    <td className="p-3 text-gray-300">${a.balance.toFixed(2)}</td>
                    <td className="p-3 text-gray-300">{a.commission_rate}%</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-lg text-xs ${a.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                        {a.is_active ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-300">{new Date(a.created_at).toLocaleDateString('ar-SY')}</td>
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