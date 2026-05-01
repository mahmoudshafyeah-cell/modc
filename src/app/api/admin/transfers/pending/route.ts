import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { enrichWithProfiles } from '@/lib/api-utils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function GET(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status');

    let query = supabase.from('transactions').select('*').eq('type', 'transfer').order('created_at', { ascending: false });
    if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const enriched = await enrichWithProfiles(supabase, data || [], 'user_id');

    const result = enriched.map(t => ({
      id: t.id,
      from_user_id: t.user_id,
      from_user_email: t.user_email,
      from_user_name: t.user_full_name,
      to_user: t.metadata?.recipient || '',
      to_user_id: t.metadata?.recipient_id || '',
      amount: t.amount,
      note: t.metadata?.note || '',
      status: t.status,
      created_at: t.created_at,
    }));

    return NextResponse.json({ transfers: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}