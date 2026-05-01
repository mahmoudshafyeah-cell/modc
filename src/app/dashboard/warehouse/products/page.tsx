'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, RefreshCw, Package, Upload, X, Globe } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [platformProducts, setPlatformProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', image_url: '' });
  const [activeTab, setActiveTab] = useState<'local' | 'platform'>('local');

  useEffect(() => { fetchProducts(); fetchPlatformProducts(); }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
    setLoading(false);
  }

  async function fetchPlatformProducts() {
    const { data } = await supabase.from('synced_products').select('*').order('created_at', { ascending: false });
    setPlatformProducts(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('الاسم مطلوب');
    const payload = { name: form.name, description: form.description, price: form.price ? parseFloat(form.price) : null, image_url: form.image_url };
    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId);
      if (error) toast.error('فشل التحديث'); else toast.success('تم التحديث');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) toast.error('فشل الإضافة'); else toast.success('تمت الإضافة');
    }
    setShowForm(false); setEditingId(null); setForm({ name: '', description: '', price: '', image_url: '' });
    fetchProducts();
  }

  async function deleteProduct(id: string) {
    if (!confirm('حذف المنتج؟')) return;
    await supabase.from('products').delete().eq('id', id);
    toast.success('تم الحذف');
    fetchProducts();
  }

  const syncToPlatform = async (product: any) => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('لا يوجد توكن مصادقة');

      const response = await fetch('https://modc.store/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: product.name,
          description: product.description || '',
          price: product.price || 0,
          image_url: product.image_url || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `فشلت المزامنة (HTTP ${response.status})`);
      }

      const data = await response.json();
      await supabase.from('synced_products').insert({
        product_id: product.id,
        platform_id: data.id,
        name: product.name,
        synced_at: new Date().toISOString()
      });

      toast.success(`تمت مزامنة "${product.name}" مع المنصة`);
      fetchPlatformProducts();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(error.message || 'حدث خطأ أثناء المزامنة');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">المنتجات</h1>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('local')} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'local' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}>المنتجات المحلية</button>
            <button onClick={() => setActiveTab('platform')} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'platform' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}><Globe size={16} className="inline ml-1" /> المنتجات المُزامنة</button>
          </div>
        </div>

        {activeTab === 'local' && (
          <>
            <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', description: '', price: '', image_url: '' }); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold"><Plus size={16} /> إضافة منتج</button>
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-dark-100 p-6 rounded-xl border border-gray-800 space-y-4">
                <input type="text" placeholder="الاسم" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
                <input type="text" placeholder="الوصف" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
                <input type="number" step="0.01" placeholder="السعر" value={form.price} onChange={e=>setForm({...form, price: e.target.value})} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
                <input type="text" placeholder="رابط الصورة" value={form.image_url} onChange={e=>setForm({...form, image_url: e.target.value})} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
                <button type="submit" className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold">{editingId ? 'تحديث' : 'إضافة'}</button>
              </form>
            )}
            {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div> : products.length===0 ? <div className="text-center text-gray-400">لا توجد منتجات محلية</div> :
              <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-700"><tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">الوصف</th><th className="p-3 text-right">السعر</th><th className="p-3 text-right">الصورة</th><th className="p-3 text-right">الإجراءات</th></tr></thead>
                  <tbody>
                    {products.map(p=>(
                      <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="p-3 text-gray-300">{p.name}</td><td className="p-3 text-gray-300">{p.description}</td><td className="p-3 text-gray-300">{p.price ? `$${p.price}` : '-'}</td><td className="p-3">{p.image_url ? <img src={p.image_url} className="w-8 h-8 rounded object-cover" /> : '-'}</td>
                        <td className="p-3 flex gap-2"><button onClick={()=>{ setEditingId(p.id); setForm({ name: p.name, description: p.description||'', price: p.price||'', image_url: p.image_url||'' }); setShowForm(true); }} className="text-cyan-400"><Edit size={16} /></button><button onClick={()=>deleteProduct(p.id)} className="text-red-400"><Trash2 size={16} /></button><button onClick={()=>syncToPlatform(p)} disabled={syncing} className="text-green-400 flex items-center gap-1"><Upload size={14} /> مزامنة</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          </>
        )}

        {activeTab === 'platform' && (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700"><tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">تاريخ المزامنة</th><th className="p-3 text-right">معرف المنصة</th></tr></thead>
              <tbody>
                {platformProducts.map(sp => (<tr key={sp.id} className="border-b border-gray-800 hover:bg-gray-800/50"><td className="p-3 text-gray-300">{sp.name}</td><td className="p-3 text-gray-300">{new Date(sp.synced_at).toLocaleString('ar-SY')}</td><td className="p-3 text-gray-300">{sp.platform_id}</td></tr>))}
                {platformProducts.length === 0 && <tr><td colSpan={3} className="text-center p-6 text-gray-400">لم يتم مزامنة أي منتج بعد</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}