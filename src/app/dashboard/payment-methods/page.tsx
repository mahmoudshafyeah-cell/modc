'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit, RefreshCw, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'manual' | 'auto';
  category: 'deposit' | 'withdrawal';
  is_active: boolean;
  is_p2p: boolean;
  instructions: string;
  account_number: string;
  wallet_address: string;
  barcode_image: string;
  api_endpoint: string;
  api_key: string;
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentMethod>({
    id: '',
    name: '',
    type: 'manual',
    category: 'deposit',
    is_active: true,
    is_p2p: false,
    instructions: '',
    account_number: '',
    wallet_address: '',
    barcode_image: '',
    api_endpoint: '',
    api_key: '',
  });

  useEffect(() => {
    fetchMethods();
  }, []);

  async function fetchMethods() {
    setLoading(true);
    const { data } = await supabase.from('payment_methods').select('*').order('name');
    setMethods(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('اسم طريقة الدفع مطلوب');
    const payload = { ...form };
    delete payload.id;
    if (editingId) {
      const { error } = await supabase.from('payment_methods').update(payload).eq('id', editingId);
      if (error) toast.error('فشل التحديث');
      else toast.success('تم التحديث');
    } else {
      const { error } = await supabase.from('payment_methods').insert(payload);
      if (error) toast.error('فشل الإضافة');
      else toast.success('تمت الإضافة');
    }
    setShowForm(false);
    setEditingId(null);
    setForm({
      id: '',
      name: '',
      type: 'manual',
      category: 'deposit',
      is_active: true,
      is_p2p: false,
      instructions: '',
      account_number: '',
      wallet_address: '',
      barcode_image: '',
      api_endpoint: '',
      api_key: '',
    });
    fetchMethods();
  }

  async function deleteMethod(id: string) {
    if (!confirm('حذف طريقة الدفع؟')) return;
    const { error } = await supabase.from('payment_methods').delete().eq('id', id);
    if (error) toast.error('فشل الحذف');
    else toast.success('تم الحذف');
    fetchMethods();
  }

  const handleImageUpload = async (file: File) => {
    const fileName = `payment-${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('product-images').upload(fileName, file);
    if (error) {
      toast.error('فشل رفع الصورة');
      return;
    }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
    setForm(prev => ({ ...prev, barcode_image: urlData.publicUrl }));
    toast.success('تم رفع الصورة');
  };

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">طرق الدفع</h1>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...form, name: '', instructions: '', account_number: '', wallet_address: '', barcode_image: '', api_endpoint: '', api_key: '' }); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold"><Plus size={16} /> إضافة طريقة</button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-dark-100 rounded-xl p-6 border border-gray-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="الاسم" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="p-2 rounded-lg bg-gray-800 text-white border border-gray-700" />
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="p-2 rounded-lg bg-gray-800 text-white border border-gray-700">
                <option value="manual">يدوية</option>
                <option value="auto">آلية (API)</option>
              </select>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as any })} className="p-2 rounded-lg bg-gray-800 text-white border border-gray-700">
                <option value="deposit">إيداع</option>
                <option value="withdrawal">سحب</option>
              </select>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4" /><span className="text-white">نشطة</span></label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_p2p} onChange={e => setForm({ ...form, is_p2p: e.target.checked })} className="w-4 h-4" /><span className="text-white">P2P (بينانس)</span></label>
            </div>
            <input type="text" placeholder="رقم الحساب (للطرق اليدوية)" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700" />
            <input type="text" placeholder="عنوان المحفظة (USDT...)" value={form.wallet_address} onChange={e => setForm({ ...form, wallet_address: e.target.value })} className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700" />
            <input type="text" placeholder="تعليمات" value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700" />
            {form.type === 'auto' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="API Endpoint" value={form.api_endpoint} onChange={e => setForm({ ...form, api_endpoint: e.target.value })} className="p-2 rounded-lg bg-gray-800 text-white border border-gray-700" />
                <input type="text" placeholder="API Key" value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} className="p-2 rounded-lg bg-gray-800 text-white border border-gray-700" />
              </div>
            )}
            <div>
              <label className="block text-white mb-2">صورة الباركود (اختياري)</label>
              <div className="flex items-center gap-3">
                {form.barcode_image && (
                  <div className="relative w-16 h-16">
                    <img src={form.barcode_image} alt="باركود" className="w-full h-full object-cover rounded" />
                    <button type="button" onClick={() => setForm({ ...form, barcode_image: '' })} className="absolute -top-2 -right-2 bg-red-600 rounded-full p-0.5"><X size={12} /></button>
                  </div>
                )}
                <label className="px-4 py-2 rounded-lg bg-cyan-600 text-white cursor-pointer hover:bg-cyan-700">
                  رفع صورة
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); }} />
                </label>
              </div>
            </div>
            <button type="submit" className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">{editingId ? 'تحديث' : 'إضافة'}</button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div>
        ) : methods.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد طرق دفع</div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-3 text-right">الاسم</th>
                  <th className="p-3 text-right">النوع</th>
                  <th className="p-3 text-right">الفئة</th>
                  <th className="p-3 text-right">P2P</th>
                  <th className="p-3 text-right">نشطة</th>
                  <th className="p-3 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {methods.map(m => (
                  <tr key={m.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{m.name}</td>
                    <td className="p-3 text-gray-300">{m.type === 'manual' ? 'يدوية' : 'آلية'}</td>
                    <td className="p-3 text-gray-300">{m.category === 'deposit' ? 'إيداع' : 'سحب'}</td>
                    <td className="p-3 text-gray-300">{m.is_p2p ? '✅' : '❌'}</td>
                    <td className="p-3 text-gray-300">{m.is_active ? '✅' : '❌'}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => { setEditingId(m.id); setForm(m); setShowForm(true); }} className="text-cyan-400"><Edit size={16} /></button>
                      <button onClick={() => deleteMethod(m.id)} className="text-red-400"><Trash2 size={16} /></button>
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