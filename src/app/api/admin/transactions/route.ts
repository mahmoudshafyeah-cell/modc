import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const url = new URL(req.url);
    const requestedUserId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // ✅ حماية إضافية: المستخدم العادي لا يمكنه طلب معاملات شخص آخر
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff') {
      if (requestedUserId && requestedUserId !== decoded.id) {
        return NextResponse.json({ error: 'غير مصرح بعرض هذه المعاملات' }, { status: 403 });
      }
    }

    const userId = requestedUserId || decoded.id;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const transactions = data.map(tx => ({
      ...tx,
      description: tx.metadata?.product_name || tx.type,
      direction: tx.type === 'deposit' || tx.type === 'refund' ? 'in' : 'out',
    }));

    return NextResponse.json({ transactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}