'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function GeneralSettings() {
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    platform_version: '1.0.0',
    copyright_text: '',
    force_agent_2fa: false,
    default_theme: 'dark',
    site_name: 'ModC',
    footer_description:
      'منصة ModC – وجهتك الأولى للمنتجات الرقمية في سوريا والمنطقة العربية. محفظة رقمية، منتجات موثوقة، تسليم فوري.',
    footer_phone: '+963 933 068 923',
    footer_email_info: 'info@modc.store',
    footer_email_faq: 'faq@modc.store',
    footer_address: 'سوريا - مصياف',
    footer_copyright: '© 2026 ModC. جميع الحقوق محفوظة.',
    whatsapp_enabled: true,
    whatsapp_number: '963933068923',
    site_logo: 'https://modc.store/assets/images/app_logo.png',
    site_favicon: 'https://modc.store/favicon.ico',
    enable_2fa: true,
    agent_selling_enabled: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const data = await res.json();
      if (res.ok) setSettings((prev) => ({ ...prev, ...data.settings }));
    } catch (error) {
      toast.error('فشل جلب الإعدادات');
    } finally {
      setLoading(false);
    }
  }

  async function updateSetting(key: string, value: any) {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error('فشل التحديث');
      toast.success('تم تحديث الإعداد');
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-dark-100 p-6 rounded-xl border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">الإعدادات العامة</h3>

        <div className="space-y-4">
          {/* اسم المنصة */}
          <div>
            <label className="block text-white mb-2">اسم المنصة</label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              onBlur={() => updateSetting('site_name', settings.site_name)}
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
            />
          </div>

          {/* وضع الصيانة */}
          <div className="flex items-center justify-between">
            <span className="text-white">وضع الصيانة</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) => {
                  setSettings({ ...settings, maintenance_mode: e.target.checked });
                  updateSetting('maintenance_mode', e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-violet-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          {/* إصدار المنصة */}
          <div>
            <label className="block text-white mb-2">إصدار المنصة</label>
            <input
              type="text"
              value={settings.platform_version}
              onChange={(e) => setSettings({ ...settings, platform_version: e.target.value })}
              onBlur={() => updateSetting('platform_version', settings.platform_version)}
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
            />
          </div>

          {/* حقوق النشر (داخلية) */}
          <div>
            <label className="block text-white mb-2">حقوق النشر (داخلية)</label>
            <input
              type="text"
              value={settings.copyright_text}
              onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })}
              onBlur={() => updateSetting('copyright_text', settings.copyright_text)}
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
            />
          </div>

          {/* الثيم الافتراضي */}
          <div>
            <label className="block text-white mb-2">الثيم الافتراضي للمستخدمين الجدد</label>
            <select
              value={settings.default_theme}
              onChange={(e) => {
                setSettings({ ...settings, default_theme: e.target.value });
                updateSetting('default_theme', e.target.value);
              }}
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
            >
              <option value="dark">داكن</option>
              <option value="light">فاتح</option>
            </select>
          </div>

          {/* إجبار الوكلاء على 2FA */}
          <div className="flex items-center justify-between">
            <span className="text-white">إجبار الوكلاء على المصادقة الثنائية</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.force_agent_2fa}
                onChange={(e) => {
                  setSettings({ ...settings, force_agent_2fa: e.target.checked });
                  updateSetting('force_agent_2fa', e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-violet-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          {/* تفعيل المصادقة الثنائية للمستخدمين */}
          <div className="flex items-center justify-between">
            <span className="text-white">السماح للمستخدمين بتفعيل المصادقة الثنائية</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_2fa}
                onChange={(e) => {
                  setSettings({ ...settings, enable_2fa: e.target.checked });
                  updateSetting('enable_2fa', e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-violet-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          {/* بيع الوكلاء المباشر للعملاء */}
          <div className="flex items-center justify-between">
            <span className="text-white">تفعيل بيع الوكلاء المباشر للعملاء</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.agent_selling_enabled}
                onChange={(e) => {
                  setSettings({ ...settings, agent_selling_enabled: e.target.checked });
                  updateSetting('agent_selling_enabled', e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-violet-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          {/* تفعيل واتساب */}
          <div className="flex items-center justify-between">
            <span className="text-white">تفعيل دعم واتساب</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.whatsapp_enabled}
                onChange={(e) => {
                  setSettings({ ...settings, whatsapp_enabled: e.target.checked });
                  updateSetting('whatsapp_enabled', e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-violet-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          {/* رقم واتساب */}
          <div>
            <label className="block text-white mb-2">رقم واتساب للدعم (مع رمز الدولة)</label>
            <input
              type="text"
              value={settings.whatsapp_number}
              onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
              onBlur={() => updateSetting('whatsapp_number', settings.whatsapp_number)}
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
              dir="ltr"
            />
          </div>

          {/* الشعار */}
          <div>
            <label className="block text-white mb-2">شعار الموقع (URL)</label>
            <input
              type="text"
              value={settings.site_logo}
              onChange={(e) => setSettings({ ...settings, site_logo: e.target.value })}
              onBlur={() => updateSetting('site_logo', settings.site_logo)}
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
              dir="ltr"
            />
          </div>

          {/* favicon */}
          <div>
            <label className="block text-white mb-2">أيقونة الموقع (favicon URL)</label>
            <input
              type="text"
              value={settings.site_favicon}
              onChange={(e) => setSettings({ ...settings, site_favicon: e.target.value })}
              onBlur={() => updateSetting('site_favicon', settings.site_favicon)}
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
              dir="ltr"
            />
          </div>

          {/* وصف الفوتر */}
          <div>
            <label className="block text-white mb-2">وصف الفوتر</label>
            <textarea
              value={settings.footer_description}
              onChange={(e) => setSettings({ ...settings, footer_description: e.target.value })}
              onBlur={() => updateSetting('footer_description', settings.footer_description)}
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
              rows={2}
            />
          </div>

          {/* هاتف الفوتر */}
          <div>
            <label className="block text-white mb-2">رقم الهاتف</label>
            <input
              type="text"
              value={settings.footer_phone}
              onChange={(e) => setSettings({ ...settings, footer_phone: e.target.value })}
              onBlur={() => updateSetting('footer_phone', settings.footer_phone)}
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
            />
          </div>

          {/* البريد info */}
          <div>
            <label className="block text-white mb-2">البريد الإلكتروني (info)</label>
            <input
              type="email"
              value={settings.footer_email_info}
              onChange={(e) => setSettings({ ...settings, footer_email_info: e.target.value })}
              onBlur={() => updateSetting('footer_email_info', settings.footer_email_info)}
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
            />
          </div>

          {/* البريد faq */}
          <div>
            <label className="block text-white mb-2">البريد الإلكتروني (الأسئلة الشائعة)</label>
            <input
              type="email"
              value={settings.footer_email_faq}
              onChange={(e) => setSettings({ ...settings, footer_email_faq: e.target.value })}
              onBlur={() => updateSetting('footer_email_faq', settings.footer_email_faq)}
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
            />
          </div>

          {/* العنوان */}
          <div>
            <label className="block text-white mb-2">العنوان</label>
            <input
              type="text"
              value={settings.footer_address}
              onChange={(e) => setSettings({ ...settings, footer_address: e.target.value })}
              onBlur={() => updateSetting('footer_address', settings.footer_address)}
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
            />
          </div>

          {/* حقوق النشر (الفوتر) */}
          <div>
            <label className="block text-white mb-2">حقوق النشر (الفوتر)</label>
            <input
              type="text"
              value={settings.footer_copyright}
              onChange={(e) => setSettings({ ...settings, footer_copyright: e.target.value })}
              onBlur={() => updateSetting('footer_copyright', settings.footer_copyright)}
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white"
            />
          </div>

          {/* زر النسخ الاحتياطي */}
          <button
            onClick={() =>
              window.open(
                'https://supabase.com/dashboard/project/peojndqndzkborhgkgmd/database/backups',
                '_blank'
              )
            }
            className="w-full py-3 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700"
          >
            الذهاب إلى النسخ الاحتياطي في Supabase
          </button>
        </div>
      </div>
    </div>
  );
}