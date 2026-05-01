// المسار: src/app/api/admin/agent-credits/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await supabase
      .from('agent_credits')
      .select('*, profiles!agent_credits_agent_id_fkey(full_name, email)');

    if (error) throw error;
    const credits = (data || []).map(c => ({
      id: c.id,
      agent_id: c.agent_id,
      agent_name: c.profiles?.full_name || '',
      agent_email: c.profiles?.email || '',
      credit_limit: c.credit_limit,
      used_credit: c.used_credit,
      status: c.status,
    }));
    return NextResponse.json({ credits });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { agent_id, credit_limit } = await req.json();
    if (!agent_id || credit_limit === undefined)
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: existing } = await supabase
      .from('agent_credits')
      .select('id')
      .eq('agent_id', agent_id)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('agent_credits')
        .update({ credit_limit, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('agent_credits')
        .insert({ agent_id, credit_limit, used_credit: 0, status: 'active' });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}