// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// العميل العادي (بدون توكن، للصفحات العامة)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// دالة لإنشاء عميل "مصادق" يقرأ التوكن من localStorage
export const createAuthenticatedClient = () => {
  if (typeof window === 'undefined') return supabase;
  const token = localStorage.getItem('auth_token');
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
};

// ⚠️ عميل service_role – يُستخدم فقط في API Routes (لا تستدعيه في Client Components)
export function getSupabaseAdmin() {
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY غير موجود');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}