// src/app/api/admin/withdrawals/pending/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (!['super_admin', 'staff'].includes(decoded.role))
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ withdrawals: [] });

    const userIds = [...new Set(data.map(w => w.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    const withdrawals = data.map(w => ({
      id: w.id,
      user_id: w.user_id,
      user_email: profiles?.find(p => p.id === w.user_id)?.email || '',
      user_full_name: profiles?.find(p => p.id === w.user_id)?.full_name || '',
      amount: w.amount,
      method_name: w.method_id || '',
      account: w.account || '',
      status: w.status,
      created_at: w.created_at,
      notes: w.notes,
    }));

    return NextResponse.json({ withdrawals });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}