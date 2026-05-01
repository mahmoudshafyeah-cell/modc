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
    if (decoded.role !== 'agent' && decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('agent_transactions')
      .select('created_at, profit, type')
      .eq('user_id', decoded.id)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // تجميع الأرباح يومياً
    const dailyMap: Record<string, { profit: number; sales: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('ar-SY', { weekday: 'long' });
      dailyMap[key] = { profit: 0, sales: 0 };
    }

    data?.forEach(tx => {
      const key = new Date(tx.created_at).toLocaleDateString('ar-SY', { weekday: 'long' });
      if (dailyMap[key]) {
        dailyMap[key].profit += tx.profit || 0;
        dailyMap[key].sales += 1;
      }
    });

    const chartData = Object.entries(dailyMap).map(([day, values]) => ({
      day,
      profit: values.profit,
      sales: values.sales,
    }));

    return NextResponse.json({ data: chartData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}