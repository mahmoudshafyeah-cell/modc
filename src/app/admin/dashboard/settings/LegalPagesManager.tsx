'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, Edit2, Trash2, ImageIcon, Type } from 'lucide-react';

// ==========================================
// مكون منفصل: إدارة البانرات
// ==========================================
function BannersSection() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ image_url: '', title: '', link_url: '', is_active: true });

  useEffect(() => { fetchBanners(); }, []);

  async function fetchBanners() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/banners', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setBanners(data.banners || []);
    } catch (e: any) { toast.error('فشل جلب البنرات'); }
    finally { setLoading(false); }
  }

  async function saveBanner() {
    if (!form.image_url.trim()) return toast.error('رابط الصورة مطلوب');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم حفظ البانر');
      setForm({ image_url: '', title: '', link_url: '', is_active: true });
      fetchBanners();
    } catch (e: any) { toast.error(e.message); }
  }

  async function deleteBanner(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا البانر؟')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم حذف البانر');
      fetchBanners();
    } catch (e: any) { toast.error(e.message); }
  }

  if (loading) return <div className="p-4 text-gray-400">جاري تحميل البانرات...</div>;

  return (
    <div className="bg-dark-100 p-4 rounded-xl border border-gray-700">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><ImageIcon size={18} className="text-violet-400" /> إدارة البانرات</h3>
      <div className="space-y-3 mb-4">
        <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="رابط الصورة" className="w-full p-2 rounded bg-dark-50 border border-gray-600 text-white" />
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="العنوان (اختياري)" className="w-full p-2 rounded bg-dark-50 border border-gray-600 text-white" />
        <input value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} placeholder="الرابط عند الضغط (اختياري)" className="w-full p-2 rounded bg-dark-50 border border-gray-600 text-white" />
        <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> مفعل</label>
        <button onClick={saveBanner} className="w-full py-2 rounded-xl bg-violet-600 text-white font-bold">إضافة بانر</button>
      </div>
      <div className="space-y-2">
        {banners.length === 0 ? <p className="text-gray-400 text-sm">لا توجد بنرات</p> : banners.map(b => (
          <div key={b.id} className="flex items-center justify-between bg-dark-50 p-2 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2">
              <img src={b.image_url} alt="" className="w-12 h-8 object-cover rounded" />
              <span className="text-white text-sm">{b.title || 'بدون عنوان'}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${b.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>{b.is_active ? 'مفعل' : 'معطل'}</span>
            </div>
            <button onClick={() => deleteBanner(b.id)} className="p-1.5 rounded-lg bg-red-600/20 text-red-400"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// مكون منفصل: إدارة الشريط الإخباري
// ==========================================
function TickerSection() {
  const [ticker, setTicker] = useState({ text: '', speed: 20, is_active: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTicker(); }, []);

  async function fetchTicker() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/ticker', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.ticker) setTicker(data.ticker);
    } catch (e: any) { toast.error('فشل جلب الشريط الإخباري'); }
    finally { setLoading(false); }
  }

  async function saveTicker() {
    if (!ticker.text.trim()) return toast.error('النص مطلوب');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/ticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(ticker),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم حفظ الشريط الإخباري');
    } catch (e: any) { toast.error(e.message); }
  }

  if (loading) return <div className="p-4 text-gray-400">جاري تحميل الشريط الإخباري...</div>;

  return (
    <div className="bg-dark-100 p-4 rounded-xl border border-gray-700">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Type size={18} className="text-cyan-400" /> الشريط الإخباري</h3>
      <div className="space-y-3">
        <textarea value={ticker.text} onChange={e => setTicker({ ...ticker, text: e.target.value })} placeholder="نص الشريط الإخباري..." rows={3} className="w-full p-2 rounded bg-dark-50 border border-gray-600 text-white" />
        <input type="number" value={ticker.speed} onChange={e => setTicker({ ...ticker, speed: parseInt(e.target.value) || 20 })} placeholder="السرعة (ثانية)" className="w-full p-2 rounded bg-dark-50 border border-gray-600 text-white" />
        <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={ticker.is_active} onChange={e => setTicker({ ...ticker, is_active: e.target.checked })} /> مفعل</label>
        <button onClick={saveTicker} className="w-full py-2 rounded-xl bg-violet-600 text-white font-bold">حفظ الشريط الإخباري</button>
      </div>
    </div>
  );
}

// ==========================================
// المكون الرئيسي: LegalPagesManager
// ==========================================
const SLUGS = {
  'privacy-policy': 'سياسة الخصوصية',
  'terms-of-service': 'شروط الاستخدام',
  'faq': 'الأسئلة الشائعة',
  'about': 'عن منصة MODC',
  'who-we-are': 'من نحن',
};

export default function LegalPagesManager() {
  const [pages, setPages] = useState<Record<string, { title: string; content: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });

  useEffect(() => { fetchPages(); }, []);

  async function fetchPages() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/legal-pages', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const pagesMap: any = {};
      data.pages?.forEach((p: any) => { pagesMap[p.slug] = { title: p.title, content: p.content }; });
      setPages(pagesMap);
    } catch (error: any) { toast.error('فشل جلب الصفحات'); }
    finally { setLoading(false); }
  }

  async function savePage(slug: string, title: string, content: string) {
    setSaving(slug);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/legal-pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug, title, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`تم حفظ ${SLUGS[slug as keyof typeof SLUGS]}`);
      setPages((prev) => ({ ...prev, [slug]: { title, content } }));
      setEditing(null);
    } catch (error: any) { toast.error(error.message); }
    finally { setSaving(null); }
  }

  const openEditor = (slug: string) => {
    setEditing(slug);
    setEditForm(pages[slug] || { title: SLUGS[slug as keyof typeof SLUGS], content: '' });
  };

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">تعديل الصفحات القانونية وصفحات المنصة</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(SLUGS).map(([slug, label]) => (
          <div key={slug} className="bg-dark-100 p-4 rounded-xl border border-gray-700">
            <h3 className="font-bold text-white mb-2">{label}</h3>
            {editing === slug ? (
              <div className="space-y-2">
                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="العنوان" className="w-full p-2 rounded bg-dark-50 border border-gray-600 text-white" />
                <textarea value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} placeholder="المحتوى (HTML مسموح)" rows={8} className="w-full p-2 rounded bg-dark-50 border border-gray-600 text-white" />
                <div className="flex gap-2">
                  <button onClick={() => savePage(slug, editForm.title, editForm.content)} disabled={saving === slug} className="flex-1 py-2 rounded bg-violet-600 text-white font-bold">{saving === slug ? 'جاري الحفظ...' : 'حفظ'}</button>
                  <button onClick={() => setEditing(null)} className="flex-1 py-2 rounded bg-gray-700 text-white">إلغاء</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-400 text-sm mb-3 line-clamp-3">{pages[slug]?.content?.replace(/<[^>]*>/g, '').substring(0, 100) || 'لا يوجد محتوى'}...</p>
                <button onClick={() => openEditor(slug)} className="w-full py-2 rounded bg-violet-600/20 text-violet-400 hover:bg-violet-600/30">تعديل</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* أقسام البانر والشريط الإخباري كـ Components منفصلة */}
      <BannersSection />
      <TickerSection />
    </div>
  );
}