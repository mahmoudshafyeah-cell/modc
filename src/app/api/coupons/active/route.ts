import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const WAREHOUSE_API_SECRET = process.env.WAREHOUSE_API_SECRET || 'default-secret';

export async function GET(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== WAREHOUSE_API_SECRET) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .lte('valid_from', now)
      .or(`valid_until.is.null,valid_until.gte.${now}`);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ coupons: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}