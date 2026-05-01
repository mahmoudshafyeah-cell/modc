// src/app/api/wallet/withdraw/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const { amount, method_id, account, proof_url } = await req.json(); // <-- أضفنا proof_url
    if (!amount || amount <= 0) return NextResponse.json({ error: 'المبلغ غير صالح' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: wallet } = await supabase.from('wallets').select('balance, reserved_balance').eq('user_id', decoded.id).single();
    if (!wallet) return NextResponse.json({ error: 'محفظة غير موجودة' }, { status: 400 });

    const available = wallet.balance - (wallet.reserved_balance || 0);
    if (available < amount) return NextResponse.json({ error: 'رصيد غير كافٍ' }, { status: 400 });

    // حجز المبلغ
    await supabase.from('wallets').update({ reserved_balance: (wallet.reserved_balance || 0) + amount }).eq('user_id', decoded.id);

    const { data: withdrawInsert, error } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: decoded.id,
        method_id,
        amount,
        account,
        proof_url: proof_url || null, // <-- تخزين رابط الصورة
        status: 'pending',
      })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('transactions').insert({
      user_id: decoded.id,
      type: 'withdrawal',
      amount,
      status: 'pending',
      reference_id: withdrawInsert?.id,
      balance_before: wallet.balance,
      balance_after: wallet.balance,
      metadata: { method_id, account, proof_url },
    });

    // إشعار للعميل
    await supabase.from('notifications').insert({
      user_id: decoded.id,
      title: 'طلب سحب قيد المراجعة',
      message: `تم استلام طلب السحب بقيمة $${amount.toFixed(2)} وهو قيد المراجعة.`,
      type: 'warning',
      read: false,
    });

    // إشعار للإداريين
    const { data: depositorProfile } = await supabase.from('profiles').select('email, full_name').eq('id', decoded.id).single();
    const { data: admins } = await supabase.from('user_roles').select('user_id').in('role', ['super_admin', 'staff']);
    if (admins) {
      const adminNotifications = admins.map(a => ({
        user_id: a.user_id,
        title: 'طلب سحب جديد',
        message: `طلب سحب بقيمة $${amount.toFixed(2)} من ${depositorProfile?.full_name || depositorProfile?.email || 'مستخدم'} بحاجة للمراجعة.`,
        type: 'admin',
        read: false,
        metadata: { action_url: '/dashboard?tab=withdrawals', withdrawal_id: withdrawInsert?.id, user_email: depositorProfile?.email, amount },
      }));
      await supabase.from('notifications').insert(adminNotifications);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}