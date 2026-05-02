'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Upload, MoveUp, MoveDown, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

interface Banner {
  id: string;
  image_url: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      toast.error('فشل جلب البانرات');
    } else {
      setBanners(data || []);
    }
    setLoading(false);
  }

  const sanitizeFileName = (originalName: string) => {
    const ext = originalName.split('.').pop();
    const baseName = originalName.replace(`.${ext}`, '');
    const safeName = baseName.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return `banner-${Date.now()}-${safeName || 'image'}.${ext}`;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = sanitizeFileName(file.name);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;

      const maxOrder = banners.reduce((max, b) => Math.max(max, b.sort_order || 0), 0);
      const { error: insertError } = await supabase.from('banners').insert({
        image_url: imageUrl,
        link_url: linkUrl,
        sort_order: maxOrder + 1,
        is_active: true,
      });

      if (insertError) throw insertError;

      toast.success('تمت إضافة البانر بنجاح');
      setLinkUrl('');
      setShowAddForm(false);
      fetchBanners();
    } catch (err: any) {
      toast.error(`فشل الرفع: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('حذف هذا البانر؟')) return;
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) toast.error('فشل الحذف');
    else {
      toast.success('تم الحذف');
      fetchBanners();
    }
  };

  const moveBanner = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex(b => b.id === id);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === banners.length - 1) return;

    const otherIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentBanner = banners[currentIndex];
    const otherBanner = banners[otherIndex];

    await supabase.from('banners').update({ sort_order: otherBanner.sort_order }).eq('id', currentBanner.id);
    await supabase.from('banners').update({ sort_order: currentBanner.sort_order }).eq('id', otherBanner.id);
    fetchBanners();
  };

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">إدارة البانرات</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-700"
          >
            <Plus size={16} /> إضافة بانر
          </button>
        </div>

        {showAddForm && (
          <div className="bg-dark-100 rounded-xl p-6 border border-gray-800 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">بانر جديد</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              placeholder="رابط البانر (اختياري)"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
            />
            <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white cursor-pointer hover:bg-cyan-700 w-fit">
              <Upload size={16} /> {uploading ? 'جاري الرفع...' : 'رفع صورة'}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>
        ) : banners.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد بانرات</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {banners.map((banner, index) => (
              <div key={banner.id} className="bg-dark-100 rounded-xl p-4 flex items-center gap-4 border border-gray-800">
                <img src={banner.image_url} alt="بانر" className="w-32 h-20 object-cover rounded-lg" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400">{banner.link_url || 'بدون رابط'}</p>
                  <p className="text-xs text-gray-500">الترتيب: {banner.sort_order}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => moveBanner(banner.id, 'up')} disabled={index === 0} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-30">
                    <MoveUp size={16} />
                  </button>
                  <button onClick={() => moveBanner(banner.id, 'down')} disabled={index === banners.length - 1} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-30">
                    <MoveDown size={16} />
                  </button>
                  <button onClick={() => deleteBanner(banner.id)} className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}