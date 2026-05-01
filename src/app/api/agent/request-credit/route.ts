import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const { amount } = await req.json();
    if (!amount || amount <= 0) return NextResponse.json({ error: 'المبلغ غير صالح' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: creditLimit } = await supabase
      .from('agent_credits')
      .select('credit_limit, used_credit')
      .eq('agent_id', decoded.id)
      .single();

    if (!creditLimit) return NextResponse.json({ error: 'لم يتم تعيين سقف ائتماني لك' }, { status: 400 });

    const totalCreditUsed = (creditLimit.used_credit || 0) + amount;
    if (totalCreditUsed > creditLimit.credit_limit) {
      return NextResponse.json({ error: 'لقد تجاوزت السقف الائتماني المسموح به' }, { status: 400 });
    }

    const { error: transactionError } = await supabase
      .from('agent_credit_transactions')
      .insert({ agent_id: decoded.id, type: 'credit_request', amount: amount, status: 'pending' });

    if (transactionError) throw transactionError;

    await supabase
      .from('agent_credits')
      .update({ used_credit: totalCreditUsed })
      .eq('agent_id', decoded.id);

    return NextResponse.json({ success: true, message: 'تم تقديم طلب الرصيد الإضافي بنجاح' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}