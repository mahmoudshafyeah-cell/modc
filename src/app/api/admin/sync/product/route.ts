import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const WAREHOUSE_API_SECRET = process.env.WAREHOUSE_API_SECRET || 'default-secret';

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== WAREHOUSE_API_SECRET) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { id, name, description, price, image_url, category_id, stock, delivery_time, is_active, has_codes, wholesale_price, wholesale_only, badge } = body;

    if (!name) {
      return NextResponse.json({ error: 'اسم المنتج مطلوب' }, { status: 400 });
    }

    // بناء كائن المنتج بالحقول المسموحة فقط
    const productData: any = {};

    if (name !== undefined) productData.name = name;
    if (description !== undefined) productData.description = description;
    if (price !== undefined) productData.price = price;
    if (image_url !== undefined) productData.image_url = image_url;
    if (category_id !== undefined) productData.category_id = category_id;
    if (stock !== undefined) productData.stock = stock;
    if (delivery_time !== undefined) productData.delivery_time = delivery_time;
    if (is_active !== undefined) productData.is_active = is_active;
    if (has_codes !== undefined) productData.has_codes = has_codes;
    if (wholesale_price !== undefined) productData.wholesale_price = wholesale_price;
    if (wholesale_only !== undefined) productData.wholesale_only = wholesale_only;
    if (badge !== undefined) productData.badge = badge;

    if (id) {
      // تحديث منتج موجود
      const { error } = await supabase
        .from('products')
        .update({ ...productData, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('فشل تحديث المنتج:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: 'updated', id });
    } else {
      // إنشاء منتج جديد
      const { data, error } = await supabase
        .from('products')
        .insert({ ...productData, created_at: new Date().toISOString() })
        .select('id')
        .single();

      if (error) {
        console.error('فشل إنشاء المنتج:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: 'created', id: data.id });
    }
  } catch (e: any) {
    console.error('خطأ في مزامنة المنتج:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}