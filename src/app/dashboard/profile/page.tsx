'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Save, Upload, X } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setFullName(user.user_metadata?.full_name || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, avatar_url: avatarUrl },
    });
    if (error) toast.error('فشل تحديث الملف الشخصي');
    else toast.success('تم تحديث الملف الشخصي');
    setLoading(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `avatar-${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (error) toast.error('فشل رفع الصورة');
    else {
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
      setAvatarUrl(urlData.publicUrl);
      toast.success('تم رفع الصورة');
    }
    setUploading(false);
  }

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold text-white mb-6">الملف الشخصي</h1>
        <form onSubmit={updateProfile} className="bg-dark-100 rounded-xl p-6 border border-gray-800 space-y-4">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              {avatarUrl ? (
                <div className="w-24 h-24 rounded-full overflow-hidden">
                  <img src={avatarUrl} alt="الصورة" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setAvatarUrl('')} className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1"><X size={14} /></button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-bold text-white">{fullName.charAt(0) || user?.email?.charAt(0)}</div>
              )}
              <label className="absolute bottom-0 right-0 bg-cyan-600 rounded-full p-1 cursor-pointer">
                <Upload size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-white mb-2">البريد الإلكتروني</label>
            <input type="email" value={user?.email || ''} disabled className="w-full p-2 rounded bg-gray-800 text-gray-400 border border-gray-700" />
          </div>
          <div>
            <label className="block text-white mb-2">الاسم الكامل</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold flex items-center justify-center gap-2"><Save size={18} /> {loading ? 'جاري...' : 'حفظ التغييرات'}</button>
        </form>
      </div>
    </AuthGuard>
  );
}