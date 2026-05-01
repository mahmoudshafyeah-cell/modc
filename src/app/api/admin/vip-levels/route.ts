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
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
      if (['super_admin', 'staff'].includes(decoded.role)) return;
      throw new Error('غير مصرح');
    } catch { throw new Error('jwt غير صالح'); }
  }
  
  throw new Error('غير مصرح');
}

export async function GET(req: Request) {
  try { await verifyAuth(req); } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 401 }); }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase.from('agent_vip_levels').select('*').order('min_deposit');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ levels: data || [] });
}

export async function POST(req: Request) {
  try { await verifyAuth(req); } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 401 }); }
  const body = await req.json();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await supabase.from('agent_vip_levels').insert({
    name: body.name, min_deposit: body.min_deposit, max_deposit: body.max_deposit || null,
    commission_rate: body.commission_rate || 0, discount_rate: body.discount_rate || 0,
    color: body.color || '#FFB800', image_url: body.image_url || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  try { await verifyAuth(req); } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 401 }); }
  const { id, ...body } = await req.json();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await supabase.from('agent_vip_levels').update(body).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  try { await verifyAuth(req); } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 401 }); }
  const id = new URL(req.url).searchParams.get('id');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await supabase.from('agent_vip_levels').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}