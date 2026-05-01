// المسار: src/app/api/agent/sub-agents/route.ts
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
    if (decoded.role !== 'agent' && decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('sub_agents')
      .select(`
        id,
        sub_agent_id,
        promo_code,
        commission_rate,
        status,
        joined_at,
        profiles!sub_agents_sub_agent_id_fkey(full_name, email, phone)
      `)
      .eq('agent_id', decoded.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const subAgents = (data || []).map(sa => ({
      id: sa.sub_agent_id,
      full_name: sa.profiles?.full_name || '—',
      email: sa.profiles?.email || '—',
      phone: sa.profiles?.phone || '—',
      commission_rate: sa.commission_rate,
      status: sa.status,
      joined_at: sa.joined_at,
      total_sales: 0,
      total_orders: 0,
    }));

    return NextResponse.json({ subAgents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}