// المسار: src/app/api/agent/kyc/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== 'agent') {
      return NextResponse.json({ error: 'غير مصرح - للوكلاء فقط' }, { status: 403 });
    }

    const { full_name_ar, national_id, id_front_url, id_back_url, selfie_front_url, selfie_back_url } = await req.json();

    if (!full_name_ar || !national_id || !id_front_url || !id_back_url || !selfie_front_url || !selfie_back_url) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // التحقق من وجود طلب سابق
    const { data: existing } = await supabase
      .from('kyc_verifications')
      .select('id, status')
      .eq('user_id', decoded.id)
      .single();

    if (existing && existing.status === 'pending') {
      return NextResponse.json({ error: 'لديك طلب قيد المراجعة بالفعل' }, { status: 400 });
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from('kyc_verifications')
        .update({
          full_name_ar,
          national_id,
          id_front_url,
          id_back_url,
          selfie_front_url,
          selfie_back_url,
          status: 'pending',
          submitted_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('id', existing.id);

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    } else {
      const { error: insertError } = await supabase
        .from('kyc_verifications')
        .insert({
          user_id: decoded.id,
          full_name_ar,
          national_id,
          id_front_url,
          id_back_url,
          selfie_front_url,
          selfie_back_url,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        });

      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم تقديم الطلب بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}