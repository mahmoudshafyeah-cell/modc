'use client';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { Plus, X, Edit2, Trash2, Power, Upload } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'manual' | 'local' | 'crypto' | 'bank';
  instructions: string | null;
  is_active: boolean;
  requires_proof: boolean;
  wallet_address?: string;
  min_amount?: number;
  account_number?: string;
  barcode_image?: string;
  category?: string;
  is_p2p?: boolean;
}

export default function PaymentMethodsManager() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'manual' as const,
    instructions: '',
    is_active: true,
    requires_proof: true,
    wallet_address: '',
    min_amount: '',
    account_number: '',
    barcode_image: '',
    category: 'deposit',
    is_p2p: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMethods();
  }, []);

  async function fetchMethods() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/payment-methods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب طرق الدفع');
      setMethods(data.methods || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = ev => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const openAddForm = () => {
    setEditingMethod(null);
    setForm({ name: '', type: 'manual', instructions: '', is_active: true, requires_proof: true, wallet_address: '', min_amount: '', account_number: '', barcode_image: '', category: 'deposit', is_p2p: false });
    setImageFile(null);
    setImagePreview(null);
    setFormOpen(true);
  };

  const openEditForm = (method: PaymentMethod) => {
    setEditingMethod(method);
    setForm({
      name: method.name,
      type: method.type,
      instructions: method.instructions || '',
      is_active: method.is_active,
      requires_proof: method.requires_proof,
      wallet_address: method.wallet_address || '',
      min_amount: method.min_amount?.toString() || '',
      account_number: method.account_number || '',
      barcode_image: method.barcode_image || '',
      category: method.category || 'deposit',
      is_p2p: method.is_p2p || false,
    });
    setImagePreview(method.barcode_image || null);
    setImageFile(null);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('الاسم مطلوب');
    try {
      const token = localStorage.getItem('auth_token');
      const method = editingMethod ? 'PUT' : 'POST';
      
      let barcode_image = form.barcode_image;
      if (imageFile) {
        barcode_image = imagePreview || '';
      }

      const body = {
        name: form.name,
        type: form.type,
        instructions: form.instructions,
        is_active: form.is_active,
        requires_proof: form.requires_proof,
        wallet_address: form.wallet_address || null,
        account_number: form.account_number || null,
        barcode_image: barcode_image || null,
        min_amount: form.min_amount && form.min_amount.trim() !== '' ? parseFloat(form.min_amount) : null,
        category: form.category,
        is_p2p: form.is_p2p,
      };
      
      const payload = editingMethod ? { id: editingMethod.id, ...body } : body;
      
      const res = await fetch('/api/admin/payment-methods', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ');
      toast.success(editingMethod ? 'تم التحديث' : 'تمت الإضافة');
      setFormOpen(false);
      fetchMethods();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, is_active: !current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحديث');
      fetchMethods();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/payment-methods?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      toast.success('تم الحذف');
      fetchMethods();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  const depositMethods = methods.filter(m => m.category !== 'withdrawal');
  const withdrawalMethods = methods.filter(m => m.category === 'withdrawal');

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={openAddForm} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white">
          <Plus size={16} /> إضافة طريقة دفع
        </button>
      </div>

      {/* طرق الإيداع */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">طرق الإيداع</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {depositMethods.map((m) => (
            <div key={m.id} className="rounded-xl p-4 bg-dark-100 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleActive(m.id, m.is_active)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.is_active ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    <Power size={14} />
                  </button>
                  <div>
                    <span className="font-bold text-white">{m.name}</span>
                    {m.is_p2p && <span className="mr-2 px-2 py-0.5 rounded text-xs bg-yellow-600/20 text-yellow-400">P2P</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditForm(m)} className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg bg-red-600/20 text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {m.instructions && <p className="text-xs text-gray-400 mt-2">{m.instructions}</p>}
              {m.account_number && <p className="text-xs text-gray-300 mt-1" dir="ltr">رقم الحساب: {m.account_number}</p>}
              {m.barcode_image && <div className="mt-2"><img src={m.barcode_image} alt="باركود" className="max-h-20 object-contain" /></div>}
              <div className="flex gap-3 mt-3 text-xs">
                <span className={`px-2 py-0.5 rounded ${m.is_active ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                  {m.is_active ? 'مفعل' : 'معطل'}
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-400">
                  {m.type === 'manual' ? 'يدوي' : m.type === 'local' ? 'محلي' : m.type === 'bank' ? 'بنكي' : 'رقمي'}
                </span>
              </div>
            </div>
          ))}
          {depositMethods.length === 0 && <p className="text-gray-400 col-span-2 text-center py-8">لا توجد طرق إيداع</p>}
        </div>
      </div>

      {/* طرق السحب */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">طرق السحب</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {withdrawalMethods.map((m) => (
            <div key={m.id} className="rounded-xl p-4 bg-dark-100 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleActive(m.id, m.is_active)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.is_active ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    <Power size={14} />
                  </button>
                  <span className="font-bold text-white">{m.name}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditForm(m)} className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg bg-red-600/20 text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {m.instructions && <p className="text-xs text-gray-400 mt-2">{m.instructions}</p>}
              {m.account_number && <p className="text-xs text-gray-300 mt-1" dir="ltr">رقم الحساب: {m.account_number}</p>}
              <div className="flex gap-3 mt-3 text-xs">
                <span className={`px-2 py-0.5 rounded ${m.is_active ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                  {m.is_active ? 'مفعل' : 'معطل'}
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-400">
                  {m.type === 'manual' ? 'يدوي' : m.type === 'local' ? 'محلي' : 'رقمي'}
                </span>
              </div>
            </div>
          ))}
          {withdrawalMethods.length === 0 && <p className="text-gray-400 col-span-2 text-center py-8">لا توجد طرق سحب</p>}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setFormOpen(false)}>
          <div className="bg-dark-100 rounded-2xl p-6 w-full max-w-md border border-violet-500/30 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              <h3 className="text-lg font-bold text-white">{editingMethod ? 'تعديل طريقة دفع' : 'إضافة طريقة دفع'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="الاسم" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
              
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white">
                <option value="manual">يدوي</option>
                <option value="local">محلي</option>
                <option value="bank">تحويل بنكي</option>
                <option value="crypto">رقمي</option>
              </select>

              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white">
                <option value="deposit">إيداع</option>
                <option value="withdrawal">سحب</option>
              </select>

              <label className="flex items-center gap-2 text-white mt-4">
                <input type="checkbox" checked={form.is_p2p} onChange={e => setForm({...form, is_p2p: e.target.checked})} />
                طريقة دفع P2P (Binance)
              </label>
              
              <textarea value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} placeholder="تعليمات" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" rows={2} />
              
              <input value={form.account_number} onChange={e => setForm({...form, account_number: e.target.value})} placeholder="رقم الحساب / رقم الهاتف" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
              
              <div>
                <label className="text-white block mb-2">صورة الباركود (اختياري)</label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-700">
                    <img src={imagePreview} alt="معاينة" className="w-full max-h-32 object-contain" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); setForm({...form, barcode_image: ''}); }} className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-red-600/80 text-white flex items-center justify-center">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} className="w-full py-8 rounded-xl bg-dark-50 border border-dashed border-gray-600 text-gray-400 flex flex-col items-center gap-2 hover:border-violet-500 transition-colors">
                    <Upload size={24} />
                    <span>اضغط لرفع صورة الباركود</span>
                  </button>
                )}
              </div>
              
              {form.type === 'crypto' && (
                <>
                  <input value={form.wallet_address} onChange={e => setForm({...form, wallet_address: e.target.value})} placeholder="عنوان المحفظة" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
                  <input value={form.min_amount} onChange={e => setForm({...form, min_amount: e.target.value})} type="number" step="0.01" placeholder="الحد الأدنى (USD)" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
                </>
              )}
              
              <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> مفعلة</label>
              <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={form.requires_proof} onChange={e => setForm({...form, requires_proof: e.target.checked})} /> تتطلب إثبات</label>
              
              <button type="submit" className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold">{editingMethod ? 'تحديث' : 'إضافة'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}