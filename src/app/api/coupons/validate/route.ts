import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const { code, productId } = await req.json();

    if (!code) return NextResponse.json({ error: 'كود الكوبون مطلوب' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // البحث عن الكوبون
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !coupon) return NextResponse.json({ error: 'كوبون غير صالح أو منتهي الصلاحية' }, { status: 400 });

    // التحقق من تاريخ الصلاحية
    if (coupon.valid_from) {
      const now = new Date().toISOString();
      if (now < coupon.valid_from) return NextResponse.json({ error: 'هذا الكوبون غير مفعل بعد' }, { status: 400 });
    }
    if (coupon.valid_until) {
      const now = new Date().toISOString();
      if (now > coupon.valid_until) return NextResponse.json({ error: 'انتهت صلاحية هذا الكوبون' }, { status: 400 });
    }

    // التحقق من عدد مرات الاستخدام
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ error: 'تم استخدام الحد الأقصى للكوبون' }, { status: 400 });
    }

    return NextResponse.json({ valid: true, coupon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}