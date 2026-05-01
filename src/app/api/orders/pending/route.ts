import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const WAREHOUSE_API_SECRET = process.env.WAREHOUSE_API_SECRET || 'default-secret';

export async function GET(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== WAREHOUSE_API_SECRET) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('id, product_id, user_id, amount, created_at')
      .eq('status', 'pending_allocation')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}