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

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, ticket_replies(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ tickets: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    const { subject, message, priority } = await req.json();
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({ user_id: userId, subject, priority })
      .select()
      .single();
    if (ticketError) throw ticketError;

    const { error: replyError } = await supabase
      .from('ticket_replies')
      .insert({ ticket_id: ticket.id, user_id: userId, message });
    if (replyError) throw replyError;

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}