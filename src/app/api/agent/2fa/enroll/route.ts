import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // استخدام admin API مع userId
    const { data, error } = await supabase.auth.admin.mfa.enroll({
      userId: decoded.id,
      factorType: 'totp',
    });
    
    if (error) throw error;
    return NextResponse.json({ id: data.id, qr_code: data.totp.qr_code, secret: data.totp.secret });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'فشل تسجيل 2FA' }, { status: 500 });
  }
}