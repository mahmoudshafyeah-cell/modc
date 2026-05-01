import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const token = authHeader.replace('Bearer ', '');
  let userId: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    userId = decoded.id;
  } catch {
    return NextResponse.json({ error: 'jwt غير صالح' }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // جلب مستوى الوكيل الحالي
  const { data: assignment } = await supabase
    .from('agent_vip_assignments')
    .select('level_id, agent_vip_levels(*)')
    .eq('agent_id', userId)
    .single();

  // جلب جميع المستويات
  const { data: levels } = await supabase
    .from('agent_vip_levels')
    .select('*')
    .order('min_deposit', { ascending: true });

  // جلب إجمالي إيداعات الوكيل
  const { data: deposits } = await supabase
    .from('deposit_requests')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'completed');

  const totalDeposited = deposits?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

  
  return NextResponse.json({
    currentLevel: assignment?.agent_vip_levels || null,
    allLevels: levels || [],
    totalDeposited,
  });
}