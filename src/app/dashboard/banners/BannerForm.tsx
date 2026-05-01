'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function BannerForm({ open, onClose, onSuccess, initialData }: any) {
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '', button_text: '', sort_order: '0', is_active: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        subtitle: initialData.subtitle || '',
        image_url: initialData.image_url || '',
        link_url: initialData.link_url || '',
        button_text: initialData.button_text || '',
        sort_order: initialData.sort_order?.toString() || '0',
        is_active: initialData.is_active,
      });
      setImagePreview(initialData.image_url || null);
    } else {
      setForm({ title: '', subtitle: '', image_url: '', link_url: '', button_text: '', sort_order: '0', is_active: true });
      setImagePreview(null);
    }
  }, [initialData, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = ev => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      let image_url = form.image_url;
      if (imageFile) image_url = imagePreview || ''; // لاحقاً يمكن رفع الصورة إلى Supabase Storage

      const token = localStorage.getItem('auth_token');
      const method = initialData ? 'PUT' : 'POST';
      const payload = initialData ? { id: initialData.id, ...form, image_url } : { ...form, image_url };
      const res = await fetch('/api/admin/banners', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(initialData ? 'تم التحديث' : 'تمت الإضافة');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-dark-100 rounded-2xl p-6 w-full max-w-md border border-violet-500/30 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
          <h3 className="text-lg font-bold text-white">{initialData ? 'تعديل بنر' : 'إضافة بنر'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="العنوان" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
          <input value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} placeholder="العنوان الفرعي" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
          <input value={form.link_url} onChange={e => setForm({...form, link_url: e.target.value})} placeholder="الرابط" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
          <input value={form.button_text} onChange={e => setForm({...form, button_text: e.target.value})} placeholder="نص الزر" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
          <input value={form.sort_order} onChange={e => setForm({...form, sort_order: e.target.value})} type="number" placeholder="الترتيب" className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" />
          
          <div>
            <label className="text-white block mb-2">صورة البنر</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-700">
                <img src={imagePreview} alt="معاينة" className="w-full max-h-32 object-cover" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); setForm({...form, image_url: ''}); }} className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-red-600/80 text-white flex items-center justify-center">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="w-full py-8 rounded-xl bg-dark-50 border border-dashed border-gray-600 text-gray-400 flex flex-col items-center gap-2">
                <Upload size={24} />
                <span>اضغط لرفع صورة البنر</span>
              </button>
            )}
          </div>
          
          <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> نشط</label>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold">{loading ? 'جاري الحفظ...' : initialData ? 'تحديث' : 'إضافة'}</button>
        </form>
      </div>
    </div>
  );
}