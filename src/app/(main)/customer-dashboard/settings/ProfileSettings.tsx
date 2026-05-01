'use client';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Upload, Camera } from 'lucide-react';
import { createAuthenticatedClient } from '@/lib/supabase';

export default function ProfileSettings({ userId: _userId, initialProfile: _initialProfile }: { userId?: string; initialProfile?: any }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.id);
      fetchProfile(payload.id);
    }
  }, []);

  const fetchProfile = async (uid: string) => {
    const supabase = createAuthenticatedClient();
    const { data } = await supabase.from('profiles').select('full_name, phone, avatar_url').eq('id', uid).single();
    if (data) {
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
      setAvatarUrl(data.avatar_url || null);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const supabase = createAuthenticatedClient();
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createAuthenticatedClient();
      const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', userId);
      if (error) throw error;
      toast.success('تم تحديث الملف الشخصي');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await handleAvatarUpload(file);
      const supabase = createAuthenticatedClient();
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
      setAvatarUrl(url);
      toast.success('تم تحديث الصورة');
    } catch (error: any) {
      toast.error('فشل رفع الصورة');
    }
  };

  if (!userId) return <div className="text-gray-400 p-4">جاري التحميل...</div>;

  return (
    <form onSubmit={handleSubmit} className="bg-dark-100 p-6 rounded-xl border border-gray-700 space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-violet-600/30 flex items-center justify-center overflow-hidden border-2 border-violet-500">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Camera size={32} className="text-violet-400" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 left-0 w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white"
          >
            <Upload size={12} />
          </button>
          <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
        <div>
          <p className="text-white font-medium">الصورة الشخصية</p>
          <p className="text-xs text-gray-400">JPG, PNG (حتى 2MB)</p>
        </div>
      </div>

      <div>
        <label className="block text-white mb-2">الاسم الكامل</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" required />
      </div>
      <div>
        <label className="block text-white mb-2">رقم الهاتف</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white" dir="ltr" />
      </div>
      <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold disabled:opacity-50">
        {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
      </button>
    </form>
  );
}