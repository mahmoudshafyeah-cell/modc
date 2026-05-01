import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const WAREHOUSE_API_SECRET = process.env.WAREHOUSE_API_SECRET || 'default-secret';

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== WAREHOUSE_API_SECRET) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  const { orderId, assetData } = await req.json();
  if (!orderId || !assetData) {
    return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: 'تم استلام الأصل (اختبار)' });
}