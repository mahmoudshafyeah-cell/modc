import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    // يجب أن يكون المستخدم وكيلاً حتى نتحقق
    if (decoded.role !== 'agent') return NextResponse.json({ isSubAgent: false });

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || decoded.id;

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await supabase
      .from('sub_agents')
      .select('id')
      .eq('sub_agent_id', userId)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ isSubAgent: !!data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}