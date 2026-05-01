import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. محاولة تسجيل الدخول
  const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 401 });
  }

  const user = authData.user;

  // 2. التحقق من حظر المستخدم
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_banned')
    .eq('id', user.id)
    .single();

  if (profile?.is_banned) {
    return NextResponse.json({ error: 'تم حظر حسابك. يرجى التواصل مع الدعم.' }, { status: 403 });
  }

  // 3. التحقق من إعدادات 2FA العامة
  const { data: settings2FA } = await supabaseAdmin
    .from('platform_settings')
    .select('value')
    .eq('key', 'enable_2fa')
    .single();

  const is2FAEnabledGlobally = settings2FA?.value !== false;

  // 4. التحقق مما إذا كان المستخدم قد فعّل 2FA
  const { data: factors } = await supabaseAdmin.auth.mfa.listFactors({ userId: user.id });
  const has2FA = factors?.totp.length > 0;

  if (is2FAEnabledGlobally && has2FA) {
    return NextResponse.json({ requires2FA: true, userId: user.id });
  }

  return await completeLogin(supabaseAdmin, user, email, req);
}

async function completeLogin(supabaseAdmin: any, user: any, email: string, req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') || 'unknown';
  await supabaseAdmin.from('profiles').update({
    last_sign_in_at: new Date().toISOString(),
    last_sign_in_ip: ip,
  }).eq('id', user.id);

  const { data: roleRow } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  let role = roleRow?.role || 'customer';
  if (email === 'admin@modc.sy') {
    role = 'super_admin';
    await supabaseAdmin.from('user_roles').upsert({ user_id: user.id, role: 'super_admin' });
  }

  let permissions: string[] = [];
  if (role === 'staff') {
    const { data: permData } = await supabaseAdmin
      .from('staff_permissions')
      .select('permissions')
      .eq('user_id', user.id)
      .single();
    permissions = permData?.permissions || [];
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role, permissions },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  let redirectPath = '/customer-dashboard';
  if (role === 'super_admin' || role === 'staff') redirectPath = '/dashboard';
  else if (role === 'agent') redirectPath = '/agent-dashboard';

  const response = NextResponse.json({
    token,
    redirectPath,
    user: { id: user.id, email: user.email, role, permissions },
  });

  return response;
}

// التحقق من رمز 2FA
export async function PUT(req: Request) {
  const { userId, code } = await req.json();
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: factors } = await supabaseAdmin.auth.mfa.listFactors({ userId });
  const factor = factors?.totp[0];
  if (!factor) return NextResponse.json({ error: 'لم يتم العثور على إعدادات 2FA' }, { status: 400 });

  const { data: challenge } = await supabaseAdmin.auth.mfa.challenge({ factorId: factor.id });
  const { error } = await supabaseAdmin.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
  return await completeLogin(supabaseAdmin, user.user, user.user.email, req);
}