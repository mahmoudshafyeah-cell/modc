import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // 1. إجمالي الإنفاق
    const { data: spentData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', decoded.id)
      .eq('type', 'purchase')
      .eq('status', 'completed');

    const total_spent = spentData?.reduce((sum, t) => sum + t.amount, 0) || 0;

    // 2. إجمالي الطلبات
    const { count: total_orders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', decoded.id);

    // 3. الطلبات المعلقة
    const { count: pending_orders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', decoded.id)
      .in('status', ['pending', 'processing']);

    // 4. إجمالي التوفير (يمكن حسابه من original_price في order_items أو products)
    const { data: orders } = await supabase
      .from('orders')
      .select('amount, products(price, original_price)')
      .eq('user_id', decoded.id)
      .eq('status', 'completed');

    const total_saved = orders?.reduce((sum, order) => {
      const original = order.products?.original_price;
      const paid = order.amount;
      if (original && original > paid) return sum + (original - paid);
      return sum;
    }, 0) || 0;

    return NextResponse.json({
      total_spent,
      total_orders: total_orders || 0,
      pending_orders: pending_orders || 0,
      total_saved,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}