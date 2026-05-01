// المسار: src/app/api/admin/withdrawals/approve/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string; id: string };
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { id, reason } = await req.json();
    if (!id) return NextResponse.json({ error: 'معرف السحب مطلوب' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: withdrawal } = await supabase
      .from('withdrawal_requests').select('*').eq('id', id).eq('status', 'pending').single();
    if (!withdrawal) return NextResponse.json({ error: 'طلب السحب غير موجود' }, { status: 404 });

    await supabase.from('withdrawal_requests').update({
      status: 'completed', notes: reason || 'تمت الموافقة', approved_at: new Date().toISOString()
    }).eq('id', id);

    const { data: wallet } = await supabase.from('wallets').select('balance, reserved_balance').eq('user_id', withdrawal.user_id).single();
    if (wallet) {
      await supabase.from('wallets').update({
        balance: wallet.balance - withdrawal.amount,
        reserved_balance: (wallet.reserved_balance || 0) - withdrawal.amount,
        updated_at: new Date().toISOString(),
      }).eq('user_id', withdrawal.user_id);
    }

    await supabase.from('transactions').insert({
      user_id: withdrawal.user_id,
      type: 'withdrawal',
      amount: withdrawal.amount,
      balance_before: wallet?.balance || 0,
      balance_after: (wallet?.balance || 0) - withdrawal.amount,
      status: 'completed',
      reference_id: id,
      metadata: { approved_by: decoded.id, reason },
    });

    await supabase.from('notifications').insert({
      user_id: withdrawal.user_id,
      title: 'تمت الموافقة على طلب السحب',
      message: `تمت الموافقة على طلب السحب بقيمة $${withdrawal.amount.toFixed(2)}.`,
      type: 'success',
      read: false,
      metadata: { action_url: '/customer-dashboard/transactions' },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}