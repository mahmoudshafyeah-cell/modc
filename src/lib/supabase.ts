import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// العميل العادي (بدون توكن، للصفحات العامة مثل عرض المنتجات)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// دالة لإنشاء عميل "مصادق" يقرأ التوكن من localStorage ويضيفه للطلبات تلقائياً
export const createAuthenticatedClient = () => {
  if (typeof window === 'undefined') return supabase;
  const token = localStorage.getItem('auth_token');
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
};