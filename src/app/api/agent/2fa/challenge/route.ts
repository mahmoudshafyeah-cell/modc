import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    jwt.verify(token, JWT_SECRET) as { id: string };

    const { factorId } = await req.json();
    if (!factorId) return NextResponse.json({ error: 'factorId مطلوب' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });
    if (error) throw error;
    return NextResponse.json({ challengeId: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'فشل التحدي' }, { status: 500 });
  }
}