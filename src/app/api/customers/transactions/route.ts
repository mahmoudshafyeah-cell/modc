// المسار: src/app/api/customer/transactions/route.ts
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

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const type = url.searchParams.get('type');

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    let query = supabase.from('transactions').select('*').eq('user_id', decoded.id).order('created_at', { ascending: false }).limit(limit);
    if (type && type !== 'all') query = query.eq('type', type);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const transactions = (data || []).map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      balance_before: tx.balance_before,
      balance_after: tx.balance_after,
      status: tx.status,
      description: tx.metadata?.product_name || tx.metadata?.note || tx.type,
      direction: tx.type === 'deposit' || tx.type === 'refund' ? 'in' : 'out',
      created_at: tx.created_at,
      metadata: tx.metadata,
    }));

    return NextResponse.json({ transactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}