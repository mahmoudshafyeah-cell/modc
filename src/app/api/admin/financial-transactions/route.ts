import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    } catch {
      return NextResponse.json({ error: 'توكن غير صالح' }, { status: 401 });
    }
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: transactions } = await supabase.from('transactions').select('id, type, amount, user_id, created_at').order('created_at', { ascending: false }).limit(10);

    return NextResponse.json({ transactions: transactions || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}