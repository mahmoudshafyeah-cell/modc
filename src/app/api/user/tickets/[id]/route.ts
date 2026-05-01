import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) throw new Error('غير مصرح');
  const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
  return decoded.id;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const userId = await getUserId(req);
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (ticketError) throw ticketError;

    const { data: replies, error: repliesError } = await supabase
      .from('ticket_replies')
      .select('*, profiles(full_name)')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });
    if (repliesError) throw repliesError;

    return NextResponse.json({ ticket, replies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const userId = await getUserId(req);
    const { message } = await req.json();
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (!ticket) return NextResponse.json({ error: 'التذكرة غير موجودة' }, { status: 404 });

    const { error } = await supabase
      .from('ticket_replies')
      .insert({ ticket_id: id, user_id: userId, message });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}