'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';
import { Save, RefreshCw, Upload, X } from 'lucide-react';

interface Settings {
  id?: string;
  site_name: string;
  site_logo: string;
  favicon: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  footer_copyright: string;
  whatsapp_number: string;
  telegram_link: string;
  facebook_link: string;
  twitter_link: string;
  instagram_link: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    site_name: 'ModC',
    site_logo: '',
    favicon: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    footer_copyright: '© 2025 ModC',
    whatsapp_number: '',
    telegram_link: '',
    facebook_link: '',
    twitter_link: '',
    instagram_link: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .maybeSingle();
    if (error && error.code !== 'PGRST116') {
      toast.error('فشل جلب الإعدادات');
    } else if (data) {
      setSettings(data);
    }
    setLoading(false);
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('platform_settings')
      .upsert(settings, { onConflict: 'id' });
    if (error) {
      toast.error('فشل حفظ الإعدادات: ' + error.message);
    } else {
      toast.success('تم حفظ الإعدادات');
    }
    setSaving(false);
  }

  const handleImageUpload = async (file: File, type: 'logo' | 'favicon') => {
    if (!file) return;
    const ext = file.name.split('.').pop();
    const fileName = `${type}-${Date.now()}.${ext}`;
    if (type === 'logo') setUploadingLogo(true);
    else setUploadingFavicon(true);

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (error) {
      toast.error('فشل رفع الصورة');
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingFavicon(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
    if (type === 'logo') {
      setSettings(prev => ({ ...prev, site_logo: urlData.publicUrl }));
      setUploadingLogo(false);
    } else {
      setSettings(prev => ({ ...prev, favicon: urlData.publicUrl }));
      setUploadingFavicon(false);
    }
    toast.success('تم رفع الصورة');
  };

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">الإعدادات العامة</h1>
          <button
            onClick={fetchSettings}
            className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600"
            title="تحديث"
          >
            <RefreshCw size={18} className="text-gray-300" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={saveSettings} className="bg-dark-100 rounded-xl p-6 border border-gray-800 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* اسم الموقع */}
              <div>
                <label className="block text-white mb-2">اسم الموقع</label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={e => setSettings({ ...settings, site_name: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
                  required
                />
              </div>

              {/* البريد الإلكتروني للتواصل */}
              <div>
                <label className="block text-white mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={e => setSettings({ ...settings, contact_email: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
                />
              </div>

              {/* رقم الهاتف */}
              <div>
                <label className="block text-white mb-2">رقم الهاتف</label>
                <input
                  type="tel"
                  value={settings.contact_phone}
                  onChange={e => setSettings({ ...settings, contact_phone: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
                />
              </div>

              {/* العنوان */}
              <div>
                <label className="block text-white mb-2">العنوان</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={e => setSettings({ ...settings, address: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
                />
              </div>

              {/* شعار الموقع */}
              <div>
                <label className="block text-white mb-2">شعار الموقع</label>
                <div className="flex items-center gap-3">
                  {settings.site_logo && (
                    <div className="relative w-16 h-16">
                      <img src={settings.site_logo} alt="شعار" className="w-full h-full object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, site_logo: '' })}
                        className="absolute -top-2 -right-2 bg-red-600 rounded-full p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <label className="px-4 py-2 rounded-lg bg-cyan-600 text-white cursor-pointer hover:bg-cyan-700">
                    {uploadingLogo ? 'جاري الرفع...' : 'رفع شعار'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'logo');
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* أيقونة الموقع (Favicon) */}
              <div>
                <label className="block text-white mb-2">أيقونة الموقع (Favicon)</label>
                <div className="flex items-center gap-3">
                  {settings.favicon && (
                    <div className="relative w-10 h-10">
                      <img src={settings.favicon} alt="Favicon" className="w-full h-full object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, favicon: '' })}
                        className="absolute -top-2 -right-2 bg-red-600 rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  <label className="px-4 py-2 rounded-lg bg-cyan-600 text-white cursor-pointer hover:bg-cyan-700">
                    {uploadingFavicon ? 'جاري الرفع...' : 'رفع أيقونة'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'favicon');
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* تذييل الصفحة */}
              <div className="md:col-span-2">
                <label className="block text-white mb-2">نص التذييل (Footer)</label>
                <input
                  type="text"
                  value={settings.footer_copyright}
                  onChange={e => setSettings({ ...settings, footer_copyright: e.target.value })}
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
                />
              </div>
            </div>

            {/* روابط التواصل الاجتماعي */}
            <div className="border-t border-gray-700 pt-6">
              <h2 className="text-lg font-bold text-white mb-4">روابط التواصل الاجتماعي</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white mb-2">واتساب (رقم)</label>
                  <input
                    type="text"
                    value={settings.whatsapp_number}
                    onChange={e => setSettings({ ...settings, whatsapp_number: e.target.value })}
                    className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
                    placeholder="مثال: 966512345678"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">تلغرام (رابط)</label>
                  <input
                    type="text"
                    value={settings.telegram_link}
                    onChange={e => setSettings({ ...settings, telegram_link: e.target.value })}
                    className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
                    placeholder="https://t.me/..."
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">فيسبوك</label>
                  <input
                    type="text"
                    value={settings.facebook_link}
                    onChange={e => setSettings({ ...settings, facebook_link: e.target.value })}
                    className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">تويتر / X</label>
                  <input
                    type="text"
                    value={settings.twitter_link}
                    onChange={e => setSettings({ ...settings, twitter_link: e.target.value })}
                    className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">انستغرام</label>
                  <input
                    type="text"
                    value={settings.instagram_link}
                    onChange={e => setSettings({ ...settings, instagram_link: e.target.value })}
                    className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-cyan-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </form>
        )}
      </div>
    </AuthGuard>
  );
}