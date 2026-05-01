// src/app/api/push/subscribe/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const { subscription } = await req.json();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await supabase.from('push_subscriptions').upsert({ user_id: decoded.id, subscription }, { onConflict: 'user_id' });
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}