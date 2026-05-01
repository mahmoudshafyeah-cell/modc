// src/app/api/admin/deposits/reject/route.ts
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

    // 1. جلب طلب الإيداع
    const { data: deposit, error: findError } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (findError || !deposit)
      return NextResponse.json({ error: 'طلب الإيداع غير موجود أو تمت معالجته' }, { status: 404 });

    // 2. تحديث الحالة إلى مرفوض
    const { error: updateError } = await supabase
      .from('deposit_requests')
      .update({
        status: 'rejected',
        notes: reason || 'تم الرفض',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // 3. تسجيل المعاملة كمرفوضة
    await supabase.from('transactions').insert({
      user_id: deposit.user_id,
      type: 'deposit',
      amount: deposit.amount,
      status: 'rejected',
      reference_id: id,
      metadata: { rejected_by: decoded.id, reason },
    });

    // 4. إشعار للمستخدم
    await supabase.from('notifications').insert({
      user_id: deposit.user_id,
      title: 'تم رفض طلب الإيداع',
      message: `تم رفض طلب الإيداع بقيمة $${deposit.amount.toFixed(2)}. السبب: ${reason || 'غير محدد'}.`,
      type: 'warning',
      read: false,
      metadata: { action_url: '/customer-dashboard/transactions' },
    });

    // 5. إشعار للإداريين
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
      const adminNotifications = admins.map(a => ({
        user_id: a.user_id,
        title: 'تم رفض إيداع',
        message: `تم رفض إيداع بقيمة $${deposit.amount.toFixed(2)} للمستخدم ${userProfile?.full_name || userProfile?.email || 'غير معروف'}.`,
        type: 'admin',
        read: false,
        metadata: { action_url: '/dashboard?tab=deposits', deposit_id: id },
      }));
      await supabase.from('notifications').insert(adminNotifications);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}