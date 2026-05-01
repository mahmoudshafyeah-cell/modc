import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // جلب المعاملات لآخر 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('created_at, amount, type, balance_after')
      .eq('user_id', decoded.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // تجميع البيانات يومياً
    const dailyData: Record<string, { balance: number; spent: number }> = {};
    
    // تهيئة الأيام السبعة
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short' });
      dailyData[dayKey] = { balance: 0, spent: 0 };
    }

    let lastBalance = 0;
    transactions?.forEach(tx => {
      const dateKey = new Date(tx.created_at).toLocaleDateString('ar-SY', { day: 'numeric', month: 'short' });
      if (dailyData[dateKey]) {
        dailyData[dateKey].balance = tx.balance_after || lastBalance;
        if (tx.type === 'purchase') dailyData[dateKey].spent += tx.amount;
        lastBalance = tx.balance_after;
      }
    });

    const chartData = Object.entries(dailyData).map(([day, values]) => ({
      day,
      balance: values.balance,
      spent: values.spent,
    }));

    return NextResponse.json({ data: chartData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}