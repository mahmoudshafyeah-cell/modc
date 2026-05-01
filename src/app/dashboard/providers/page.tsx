'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit, RefreshCw, ExternalLink, Wifi, X } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

interface Provider {
  id: string;
  name: string;
  type: string;
  data: any;
  created_at: string;
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'api', data: '{}' });
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    setLoading(true);
    const { data, error } = await supabase.from('external_providers').select('*').order('name');
    if (error) toast.error('فشل جلب المزودين');
    else setProviders(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let parsedData;
    try {
      parsedData = JSON.parse(form.data);
    } catch {
      toast.error('صيغة JSON غير صالحة');
      return;
    }
    const payload = { name: form.name, type: form.type, data: parsedData };
    if (editingId) {
      const { error } = await supabase.from('external_providers').update(payload).eq('id', editingId);
      if (error) toast.error('فشل التحديث');
      else toast.success('تم التحديث');
    } else {
      const { error } = await supabase.from('external_providers').insert(payload);
      if (error) toast.error('فشل الإضافة');
      else toast.success('تمت الإضافة');
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', type: 'api', data: '{}' });
    fetchProviders();
  }

  async function deleteProvider(id: string) {
    if (!confirm('حذف هذا المزود؟')) return;
    const { error } = await supabase.from('external_providers').delete().eq('id', id);
    if (error) toast.error('فشل الحذف');
    else {
      toast.success('تم الحذف');
      fetchProviders();
    }
  }

  async function testConnection(provider: Provider) {
    setTesting(provider.id);
    try {
      const { api_endpoint, api_token } = provider.data || {};
      if (!api_endpoint || !api_token) throw new Error('بيانات API غير مكتملة');
      const res = await fetch('/api/provider/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: api_endpoint, token: api_token }),
      });
      const data = await res.json();
      if (res.ok) toast.success('اتصال ناجح');
      else throw new Error(data.error || 'فشل الاتصال');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTesting(null);
    }
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">المزودون الخارجيون</h1>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', type: 'api', data: '{}' }); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-700"
          >
            <Plus size={16} /> إضافة مزود
          </button>
        </div>

        {showForm && (
          <div className="bg-dark-100 rounded-xl p-6 border border-gray-800 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">{editingId ? 'تعديل مزود' : 'مزود جديد'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <input
              type="text"
              placeholder="اسم المزود"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
              required
            />
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
            >
              <option value="api">API</option>
              <option value="bank">بنك</option>
              <option value="shipping">شحن</option>
              <option value="crypto">عملات رقمية</option>
            </select>
            <textarea
              placeholder='بيانات JSON (مثال: {"api_endpoint": "https://...", "api_token": "..."})'
              value={form.data}
              onChange={e => setForm({ ...form, data: e.target.value })}
              rows={4}
              className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 font-mono text-sm"
            />
            <button onClick={handleSubmit} className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">
              {editingId ? 'تحديث' : 'إضافة'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>
        ) : providers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد مزودون</div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-3 text-right">الاسم</th>
                  <th className="p-3 text-right">النوع</th>
                  <th className="p-3 text-right">بيانات API</th>
                  <th className="p-3 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {providers.map(p => (
                  <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{p.name}</td>
                    <td className="p-3 text-gray-300">{p.type}</td>
                    <td className="p-3 text-gray-400 text-xs truncate max-w-xs">{JSON.stringify(p.data)}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => testConnection(p)} disabled={testing === p.id} className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30">
                        {testing === p.id ? <RefreshCw size={16} className="animate-spin" /> : <Wifi size={16} />}
                      </button>
                      <button onClick={() => { setEditingId(p.id); setForm({ name: p.name, type: p.type, data: JSON.stringify(p.data, null, 2) }); setShowForm(true); }} className="p-1.5 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30"><Edit size={16} /></button>
                      <button onClick={() => deleteProvider(p.id)} className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30"><Trash2 size={16} /></button>
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