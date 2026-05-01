import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const WAREHOUSE_API_SECRET = process.env.WAREHOUSE_API_SECRET || '72e2a57f0eb5a689f40089ed620a47158822f39fc6977b7f80689d7411';

async function verifyAuth(req: Request): Promise<void> {
  const authHeader = req.headers.get('Authorization');
  const apiKey = req.headers.get('x-api-key');
  if (apiKey === WAREHOUSE_API_SECRET) return;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    try { const decoded = jwt.verify(token, JWT_SECRET) as { role: string }; if (['super_admin', 'staff'].includes(decoded.role)) return; } catch { throw new Error('jwt غير صالح'); }
  }
  throw new Error('غير مصرح');
}

export async function GET(req: Request) {
  try { await verifyAuth(req); } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 401 }); }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase.from('agent_credits').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ credits: [] });
  const userIds = [...new Set(data.map(c => c.agent_id))];
  const { data: profiles } = await supabase.from('profiles').select('id, email, full_name').in('id', userIds);
  return NextResponse.json({ credits: data.map(c => ({ id: c.id, agent_id: c.agent_id, agent_name: profiles?.find(p => p.id === c.agent_id)?.full_name || '', agent_email: profiles?.find(p => p.id === c.agent_id)?.email || '', credit_limit: c.credit_limit, used_credit: c.used_credit, status: c.status })) });
}