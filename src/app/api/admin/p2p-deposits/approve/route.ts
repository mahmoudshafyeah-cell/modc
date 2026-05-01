// src/app/api/admin/p2p-deposits/approve/route.ts
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
    if (!id) return NextResponse.json({ error: 'معرف الإيداع مطلوب' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: deposit } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (!deposit)
      return NextResponse.json({ error: 'طلب الإيداع غير موجود' }, { status: 404 });

    await supabase
      .from('deposit_requests')
      .update({ status: 'completed', notes: reason || 'تمت الموافقة', updated_at: new Date().toISOString() })
      .eq('id', id);

    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', deposit.user_id)
      .single();

    const currentBalance = wallet?.balance || 0;
    const newBalance = currentBalance + deposit.amount;

    await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', deposit.user_id);

    // تسجيل المعاملة
    await supabase.from('transactions').insert({
      user_id: deposit.user_id,
      type: 'deposit',
      amount: deposit.amount,
      balance_before: currentBalance,
      balance_after: newBalance,
      status: 'completed',
      reference_id: id,
      metadata: { type: 'p2p_binance', approved_by: decoded.id, reason },
    });

    await supabase.from('notifications').insert({
      user_id: deposit.user_id,
      title: 'تمت الموافقة على إيداع P2P',
      message: `تمت إضافة $${deposit.amount.toFixed(2)} إلى رصيدك بنجاح.`,
      type: 'success',
      read: false,
    });

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', deposit.user_id)
      .single();

    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['super_admin', 'staff']);

    if (admins && admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        user_id: admin.user_id,
        title: 'تم تأكيد إيداع P2P',
        message: `تم تأكيد إيداع P2P بقيمة $${deposit.amount.toFixed(2)} للمستخدم ${userProfile?.full_name || userProfile?.email || 'غير معروف'}.`,
        type: 'admin',
        read: false,
        metadata: {
          action_url: '/dashboard?tab=deposits',
          deposit_id: id,
          user_email: userProfile?.email,
          user_id: deposit.user_id,
          amount: deposit.amount,
        },
      }));

      await supabase.from('notifications').insert(adminNotifications);
    }

    return NextResponse.json({ success: true, newBalance });
  } catch (error: any) {
    console.error('P2P deposit approve error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}