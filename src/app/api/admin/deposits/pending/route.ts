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

    let query = supabase.from('deposit_requests').select('*').order('created_at', { ascending: false });
    if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const enriched = await enrichWithProfiles(supabase, data || []);

    const methodIds = [...new Set(enriched.map(d => d.payment_method_id).filter(Boolean))];
    let methodsMap = new Map<string, string>();
    if (methodIds.length > 0) {
      const { data: methodsData } = await supabase.from('payment_methods').select('id, name').in('id', methodIds);
      (methodsData || []).forEach(m => methodsMap.set(m.id, m.name));
    }

    const result = enriched.map(d => ({
      id: d.id, user_id: d.user_id, user_email: d.user_email, user_full_name: d.user_full_name,
      amount: d.amount, method_name: methodsMap.get(d.payment_method_id) || d.payment_method_id || 'طريقة دفع',
      proof_url: d.proof_url, type: d.type || 'normal', deposit_number: d.deposit_number,
      order_number: d.order_number, status: d.status, created_at: d.created_at,
    }));

    return NextResponse.json({ deposits: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}