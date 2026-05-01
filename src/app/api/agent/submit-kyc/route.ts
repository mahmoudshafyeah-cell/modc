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

    const body = await req.json();
    const { full_name_ar, national_id, id_front_url, id_back_url, selfie_front_url, selfie_back_url } = body;

    if (!full_name_ar || !national_id || !id_front_url || !id_back_url || !selfie_front_url || !selfie_back_url)
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // يفحص إن كان هناك طلب سابق
    const { data: existing } = await supabase
      .from('kyc_verifications')
      .select('id, status')
      .eq('user_id', decoded.id)
      .maybeSingle();

    if (existing?.status === 'pending')
      return NextResponse.json({ error: 'لديك طلب قيد المراجعة' }, { status: 400 });

    const payload = {
      user_id: decoded.id,
      full_name_ar,
      national_id,
      id_front_url,
      id_back_url,
      selfie_front_url,
      selfie_back_url,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase.from('kyc_verifications').update(payload).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('kyc_verifications').insert(payload);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'فشل تقديم الطلب' }, { status: 500 });
  }
}