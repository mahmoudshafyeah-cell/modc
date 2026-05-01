// src/app/api/admin/p2p-deposits/reject/route.ts
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
    if (!id) return NextResponse.json({ error: 'معرف الإيداع مطلوب' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: deposit } = await supabase
      .from('deposit_requests')
      .select('id, user_id, amount')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (!deposit)
      return NextResponse.json({ error: 'طلب الإيداع غير موجود' }, { status: 404 });

    await supabase
      .from('deposit_requests')
      .update({ status: 'rejected', notes: reason || 'تم الرفض' })
      .eq('id', id);

    await supabase.from('notifications').insert({
      user_id: deposit.user_id,
      title: 'تم رفض طلب الإيداع P2P',
      message: `تم رفض طلب الإيداع P2P بقيمة $${deposit.amount.toFixed(2)}. السبب: ${reason || 'غير محدد'}.`,
      type: 'warning',
      read: false,
      metadata: { action_url: '/customer-dashboard/transactions' },
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
        title: 'تم رفض إيداع P2P',
        message: `تم رفض إيداع P2P بقيمة $${deposit.amount.toFixed(2)} للمستخدم ${userProfile?.full_name || userProfile?.email || 'غير معروف'}.`,
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('P2P deposit reject error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}