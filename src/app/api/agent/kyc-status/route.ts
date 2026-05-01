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
    const { data, error } = await supabase
      .from('kyc_verifications')
      .select('*')
      .eq('user_id', decoded.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ kyc: data || null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'فشل جلب حالة KYC' }, { status: 500 });
  }
}