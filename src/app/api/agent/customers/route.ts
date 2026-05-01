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

    const { data, error } = await supabase
      .from('agent_transactions')
      .select('customer, amount, created_at')
      .eq('user_id', decoded.id)
      .eq('type', 'sell')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // تجميع العملاء (آخر ظهور)
    const customerMap = new Map<string, { phone: string; lastAmount: string; color: string }>();
    data?.forEach(tx => {
      if (!customerMap.has(tx.customer)) {
        const colors = ['#6C3AFF', '#00D4FF', '#FFB800', '#00FF94'];
        customerMap.set(tx.customer, {
          phone: tx.customer,
          lastAmount: `$${tx.amount}`,
          color: colors[customerMap.size % 4],
        });
      }
    });

    const customers = Array.from(customerMap.entries()).map(([phone, info], i) => ({
      id: `cust-${i}`,
      name: phone.split('@')[0] || phone,
      phone,
      lastAmount: info.lastAmount,
      color: info.color,
    }));

    return NextResponse.json({ customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}