// src/app/api/admin/withdrawals/reject/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { id, reason } = await req.json();
    if (!id) return NextResponse.json({ error: 'معرف السحب مطلوب' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: withdrawal } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (!withdrawal)
      return NextResponse.json({ error: 'طلب السحب غير موجود' }, { status: 404 });

    await supabase
      .from('withdrawal_requests')
      .update({ status: 'rejected', notes: reason || 'تم الرفض', updated_at: new Date().toISOString() })
      .eq('id', id);

    // تحرير المبلغ المحجوز
    const { data: wallet } = await supabase
      .from('wallets')
      .select('reserved_balance')
      .eq('user_id', withdrawal.user_id)
      .single();

    if (wallet) {
      await supabase
        .from('wallets')
        .update({ reserved_balance: (wallet.reserved_balance || 0) - withdrawal.amount })
        .eq('user_id', withdrawal.user_id);
    }

    // تسجيل المعاملة كمرفوضة
    await supabase.from('transactions').insert({
      user_id: withdrawal.user_id,
      type: 'withdrawal',
      amount: withdrawal.amount,
      status: 'rejected',
      reference_id: id,
      metadata: { rejected_by: decoded.role, reason },
    });

    // إشعار للعميل
    await supabase.from('notifications').insert({
      user_id: withdrawal.user_id,
      title: 'تم رفض طلب السحب',
      message: `تم رفض طلب السحب بقيمة $${withdrawal.amount.toFixed(2)}. السبب: ${reason || 'غير محدد'}.`,
      type: 'warning',
      read: false,
      metadata: { action_url: '/customer-dashboard/transactions' },
    });

    // جلب بيانات العميل
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', withdrawal.user_id)
      .single();

    // إشعار للإداريين
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['super_admin', 'staff']);

    if (admins && admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        user_id: admin.user_id,
        title: 'تم رفض سحب',
        message: `تم رفض سحب بقيمة $${withdrawal.amount.toFixed(2)} للمستخدم ${userProfile?.full_name || userProfile?.email || 'غير معروف'}.`,
        type: 'admin',
        read: false,
        metadata: {
          action_url: '/dashboard?tab=deposits',
          withdrawal_id: id,
          user_email: userProfile?.email,
          user_id: withdrawal.user_id,
          amount: withdrawal.amount,
        },
      }));

      await supabase.from('notifications').insert(adminNotifications);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Withdrawal reject error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}