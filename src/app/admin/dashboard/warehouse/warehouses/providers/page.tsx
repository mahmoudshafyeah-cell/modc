'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'api', data: '{}' });

  useEffect(() => { fetchProviders(); }, []);

  async function fetchProviders() {
    setLoading(true);
    const { data } = await supabase.from('external_providers').select('*').order('name');
    setProviders(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let parsedData;
    try { parsedData = JSON.parse(form.data); } catch { toast.error('JSON غير صالح'); return; }
    const payload = { name: form.name, type: form.type, data: parsedData };
    if (editingId) {
      await supabase.from('external_providers').update(payload).eq('id', editingId);
      toast.success('تم التحديث');
    } else {
      await supabase.from('external_providers').insert(payload);
      toast.success('تمت الإضافة');
    }
    setShowForm(false); setEditingId(null); setForm({ name: '', type: 'api', data: '{}' });
    fetchProviders();
  }

  async function deleteProvider(id: string) {
    if (!confirm('حذف المورد؟')) return;
    await supabase.from('external_providers').delete().eq('id', id);
    toast.success('تم الحذف');
    fetchProviders();
  }

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold text-white">الموردون الخارجيون</h1>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', type: 'api', data: '{}' }); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold"><Plus size={16} /> إضافة مورد</button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-dark-100 p-6 rounded-xl border border-gray-800 space-y-4">
            <input type="text" placeholder="اسم المورد" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
            <select value={form.type} onChange={e=>setForm({...form, type: e.target.value})} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700">
              <option value="api">API</option><option value="bank">بنك</option><option value="shipping">شحن</option><option value="crypto">عملات رقمية</option>
            </select>
            <textarea placeholder="بيانات JSON (مثل: { \&quot;api_endpoint\&quot;: \&quot;...\&quot;, \&quot;api_token\&quot;: \&quot;...\&quot; })" value={form.data} onChange={e=>setForm({...form, data: e.target.value})} rows={4} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 font-mono text-sm" />
            <button type="submit" className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">{editingId ? 'تحديث' : 'إضافة'}</button>
          </form>
        )}
        {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : providers.length===0 ? <div className="text-center text-gray-400">لا توجد موردون</div> :
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700"><tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">النوع</th><th className="p-3 text-right">الإجراءات</th></tr></thead>
              <tbody>
                {providers.map(p=>(
                  <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{p.name}</td><td className="p-3 text-gray-300">{p.type}</td>
                    <td className="p-3 flex gap-2"><button onClick={()=>{ setEditingId(p.id); setForm({ name: p.name, type: p.type, data: JSON.stringify(p.data, null, 2) }); setShowForm(true); }} className="text-cyan-400"><Edit size={16} /></button><button onClick={()=>deleteProvider(p.id)} className="text-red-400"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </AuthGuard>
  );
}