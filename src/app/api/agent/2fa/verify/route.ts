import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    jwt.verify(token, JWT_SECRET);

    const { factorId, challengeId, code } = await req.json();
    if (!factorId || !challengeId || !code) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'فشل التحقق' }, { status: 500 });
  }
}