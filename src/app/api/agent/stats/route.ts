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

    // أرباح اليوم
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyProfit } = await supabase
      .from('agent_transactions')
      .select('profit')
      .eq('user_id', decoded.id)
      .gte('created_at', today)
      .eq('type', 'sell');
    const totalDailyProfit = dailyProfit?.reduce((s, t) => s + (t.profit || 0), 0) || 0;

    // أرباح الشهر
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: monthlyProfit } = await supabase
      .from('agent_transactions')
      .select('profit')
      .eq('user_id', decoded.id)
      .gte('created_at', startOfMonth)
      .eq('type', 'sell');
    const totalMonthlyProfit = monthlyProfit?.reduce((s, t) => s + (t.profit || 0), 0) || 0;

    // مبيعات اليوم
    const { count: dailySales } = await supabase
      .from('agent_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', decoded.id)
      .gte('created_at', today)
      .eq('type', 'sell');

    // العملاء النشطون (آخر 30 يوم)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: activeCustomers } = await supabase
      .from('agent_transactions')
      .select('customer_email')
      .eq('user_id', decoded.id)
      .gte('created_at', thirtyDaysAgo)
      .eq('type', 'sell');
    const uniqueCustomers = new Set(activeCustomers?.map(c => c.customer_email));

    return NextResponse.json({
      dailyProfit: totalDailyProfit,
      monthlyProfit: totalMonthlyProfit,
      dailySales: dailySales || 0,
      activeCustomers: uniqueCustomers.size,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}