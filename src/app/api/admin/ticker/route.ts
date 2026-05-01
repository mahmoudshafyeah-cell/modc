// src/app/api/admin/ticker/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// GET: جلب الشريط الإخباري (عام - بدون حماية JWT)
export async function GET(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const url = new URL(req.url);
    const isActive = url.searchParams.get('is_active');

    // جلب جميع النصوص النشطة
    const { data, error } = await supabase
      .from('ticker')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // نرجع أول نص فقط (الأحدث)
    return NextResponse.json({ ticker: data?.[0] || null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: تعديل الشريط (محمي بـ JWT)
export async function POST(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const body = await req.json();
    const { text, speed, is_active } = body;

    if (!text) return NextResponse.json({ error: 'النص مطلوب' }, { status: 400 });

    // حذف القديم
    const { data: existingAll } = await supabase.from('ticker').select('id');
    if (existingAll && existingAll.length > 0) {
      const idsToDelete = existingAll.map((row: any) => row.id);
      await supabase.from('ticker').delete().in('id', idsToDelete);
    }

    // إدراج الجديد
    const { error } = await supabase.from('ticker').insert({
      text,
      speed: speed || 20,
      is_active: is_active ?? true,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}