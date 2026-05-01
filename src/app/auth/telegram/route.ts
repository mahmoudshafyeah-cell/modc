import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

function verifyTelegramAuth(data: any): boolean {
  const { hash, ...rest } = data;
  const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const checkString = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('\n');
  const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex');
  return hmac === hash;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // التحقق من التوقيع
    if (!verifyTelegramAuth(body)) {
      return NextResponse.json({ error: 'توقيع غير صالح' }, { status: 403 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const telegramId = String(body.id);

    // البحث عن مستخدم مرتبط بهذا telegram_id
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    let userId: string;

    if (existingProfile) {
      // المستخدم موجود - تسجيل الدخول
      userId = existingProfile.id;
    } else {
      // إنشاء مستخدم جديد
      const email = `tg_${telegramId}@telegram.modc.store`;
      const password = crypto.randomBytes(16).toString('hex');

      const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: `${body.first_name} ${body.last_name || ''}`.trim(),
          telegram_username: body.username,
          avatar_url: body.photo_url,
        },
      });

      if (signUpError) throw signUpError;
      userId = authData.user.id;

      // تحديث profiles
      await supabaseAdmin.from('profiles').update({
        telegram_id: telegramId,
        full_name: `${body.first_name} ${body.last_name || ''}`.trim(),
        avatar_url: body.photo_url,
        email_confirmed_at: new Date().toISOString(),
      }).eq('id', userId);
    }

    // جلب دور المستخدم
    const { data: roleRow } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const role = roleRow?.role || 'customer';

    const token = jwt.sign({ id: userId, email: `tg_${telegramId}@telegram.modc.store`, role }, JWT_SECRET, { expiresIn: '7d' });

    let redirectPath = '/customer-dashboard';
    if (role === 'agent') redirectPath = '/agent-dashboard';

    return NextResponse.json({ token, redirectPath });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}