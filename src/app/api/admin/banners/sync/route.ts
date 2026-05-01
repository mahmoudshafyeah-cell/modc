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
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { banners } = await req.json();
    if (!Array.isArray(banners))
      return NextResponse.json({ error: 'يجب إرسال مصفوفة من البنرات' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // حذف جميع البنرات القديمة
    const { data: existingAll } = await supabase.from('banners').select('id');
    if (existingAll && existingAll.length > 0) {
      const idsToDelete = existingAll.map((row: any) => row.id);
      await supabase.from('banners').delete().in('id', idsToDelete);
    }

    // إدخال البنرات الجديدة دفعة واحدة
    if (banners.length > 0) {
      const { error: insertError } = await supabase.from('banners').insert(
        banners.map((b: any) => ({
          image_url: b.image_url,
          link_url: b.link_url || null,
          title: b.title || null,
          sort_order: b.sort_order || 0,
          is_active: b.is_active ?? true,
        }))
      );

      if (insertError) {
        console.error('فشل إدخال البنرات:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      count: banners.length,
      message: `تمت مزامنة ${banners.length} بانر بنجاح`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}