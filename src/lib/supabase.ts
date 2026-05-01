import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// عميل Supabase العادي (للمتصفح)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// عميل مخصص بقراءة التوكن من localStorage
export const createAuthenticatedClient = () => {
  if (typeof window === 'undefined') return supabase;
  const token = localStorage.getItem('auth_token');
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  });
};

// ⚠️ عميل service_role – لا يُستورد أبداً في المتصفح. يُستخدم فقط عبر API Routes.
// إذا احتاجه أي مكون عميل، يجب استدعاء API Route بدلاً من استخدامه مباشرة.
export function getSupabaseAdmin() {
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY غير موجود');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}