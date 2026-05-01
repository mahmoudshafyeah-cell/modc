import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { jwtDecode } from 'jwt-decode';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded: any = jwtDecode(token);
    const userId = decoded.id;

    // جلب إجمالي إيداعات الوكيل (أو الشرط الآخر لتحديد المستوى)
    const { data: deposits } = await supabase
      .from('deposit_requests')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'approved');
    const totalDeposited = deposits?.reduce((sum, d) => sum + d.amount, 0) || 0;

    // جلب المستوى المناسب
    const { data: level } = await supabase
      .from('agent_vip_levels')
      .select('*')
      .lte('min_deposit', totalDeposited)
      .order('min_deposit', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({ currentLevel: level || null, totalDeposited });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}