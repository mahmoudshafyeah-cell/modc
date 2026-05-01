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
    const { amount } = await req.json();
    if (!amount || amount <= 0) return NextResponse.json({ error: 'المبلغ غير صالح' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const depositNumber = `P2P-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const orderNumber = `ORD-${Date.now()}`;

    const { error } = await supabase.from('deposit_requests').insert({
      user_id: decoded.id,
      amount,
      type: 'p2p_binance',
      deposit_number: depositNumber,
      order_number: orderNumber,
      status: 'pending',
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, deposit_number: depositNumber, order_number: orderNumber });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}