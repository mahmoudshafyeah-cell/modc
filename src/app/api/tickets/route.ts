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

    const { data, error } = await supabase
      .from('support_tickets')
      .select('id, subject, status, priority, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const userIds = [...new Set((data || []).map(t => t.user_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    const result = (data || []).map(t => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      user_email: profiles?.find(p => p.id === t.user_id)?.email || '',
      user_full_name: profiles?.find(p => p.id === t.user_id)?.full_name || '',
      created_at: t.created_at,
    }));

    return NextResponse.json({ tickets: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}