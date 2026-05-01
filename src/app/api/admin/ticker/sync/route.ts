import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (

decoded.role !== 'super_admin' && decoded.role !== 'staff')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body = await req.json();
    const { messages, speed, is_active } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'يجب إرسال مصفوفة رسائل غير فارغة' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // حذف جميع الرسائل القديمة
    const { data: existingAll } = await supabase.from('ticker').select('id');
    if (existingAll && existingAll.length > 0) {
      const idsToDelete = existingAll.map((row: any) => row.id);
      await supabase.from('ticker').delete().in('id', idsToDelete);
    }

    // إدخال الرسائل الجديدة دفعة واحدة
    const { error: insertError } = await supabase.from('ticker').insert(
      messages.map((m: any) => ({
        text: m.text,
        speed: m.speed || speed || 20,
        is_active: m.is_active !== undefined ? m.is_active : (is_active !== undefined ? is_active : true),
      }))
    );

    if (insertError) {
      console.error('فشل إدخال الرسائل:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: messages.length,
      message: `تمت مزامنة ${messages.length} رسالة بنجاح`,
    });
  } catch (e: any) {
    console.error('خطأ في مزامنة الشريط الإخباري:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}