import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  // 1. استخدام العميل العادي لتسجيل الدخول (ليس service role)
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'بيانات الدخول غير صحيحة' }, { status: 401 });
  }

  const user = authData.user;

  // 2. جلب الدور من جدول profiles
  const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, is_banned')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'الملف الشخصي غير موجود' }, { status: 404 });
  }

  if (profile.is_banned) {
    return NextResponse.json({ error: 'تم حظر حسابك. يرجى التواصل مع الدعم.' }, { status: 403 });
  }

  const role = profile.role; // 'customer', 'agent', 'sub_agent', 'admin', 'super_admin'

  // 3. إنشاء التوكن
  const token = jwt.sign(
    { id: user.id, email: user.email, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // 4. تحديد مسار التوجيه بناءً على الدور
  let redirectPath = '/customer-dashboard';
  if (role === 'super_admin' || role === 'admin') redirectPath = '/dashboard';
  else if (role === 'agent' || role === 'sub_agent') redirectPath = '/agent-dashboard';

  return NextResponse.json({
    token,
    redirectPath,
    user: { id: user.id, email: user.email, role },
  });
}