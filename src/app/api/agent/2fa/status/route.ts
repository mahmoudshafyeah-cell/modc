import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await supabase.auth.admin.listFactors({ userId: decoded.id });
    if (error) throw error;
    const totpFactor = (data?.factors || []).find((f: any) => f.type === 'totp');
    return NextResponse.json({ has2FA: !!totpFactor });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'فشل جلب حالة 2FA' }, { status: 500 });
  }
}