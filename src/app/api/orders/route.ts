import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || decoded.id;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // جلب الطلبات مع كل الأعمدة (بما فيها payment_method إن وجد)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Orders error:', ordersError);
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    // جلب المنتجات المرتبطة
    const productIds = orders.map(o => o.product_id).filter(Boolean);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, category_id')
      .in('id', productIds);

    if (productsError) {
      console.error('Products error:', productsError);
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    // جلب الفئات المرتبطة
    const categoryIds = products?.map(p => p.category_id).filter(Boolean) || [];
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', categoryIds);

    if (categoriesError) {
      console.error('Categories error:', categoriesError);
      return NextResponse.json({ error: categoriesError.message }, { status: 500 });
    }

    // دمج البيانات
    const enrichedOrders = orders.map(order => {
      const product = products?.find(p => p.id === order.product_id);
      const category = categories?.find(c => c.id === product?.category_id);
      return {
        id: order.id,
        product_name: product?.name || 'منتج غير معروف',
        category_name: category?.name || 'غير مصنف',
        amount: order.amount,
        status: order.status,
        created_at: order.created_at,
        code: order.code,
        payment_method: order.payment_method || 'رصيد المحفظة', // آمن حتى لو العمود غير موجود
      };
    });

    return NextResponse.json({ orders: enrichedOrders });
  } catch (error: any) {
    console.error('Unhandled orders API error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}