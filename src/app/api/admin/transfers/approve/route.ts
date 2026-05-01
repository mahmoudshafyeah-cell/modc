// src/app/api/admin/transfers/approve/route.ts
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
    if (!id) return NextResponse.json({ error: 'معرف التحويل مطلوب' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: transfer, error: transferError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('type', 'transfer')
      .eq('status', 'pending')
      .single();

    if (transferError || !transfer)
      return NextResponse.json({ error: 'طلب التحويل غير موجود' }, { status: 404 });

    const recipientId = transfer.metadata?.recipient_id;

    // خصم من المرسل
    const { data: senderWallet } = await supabase
      .from('wallets')
      .select('balance, reserved_balance')
      .eq('user_id', transfer.user_id)
      .single();

    if (senderWallet) {
      await supabase
        .from('wallets')
        .update({
          balance: senderWallet.balance - transfer.amount,
          reserved_balance: (senderWallet.reserved_balance || 0) - transfer.amount,
        })
        .eq('user_id', transfer.user_id);
    }

    // إضافة للمستلم
    if (recipientId) {
      const { data: recWallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', recipientId)
        .single();

      if (recWallet) {
        await supabase
          .from('wallets')
          .update({ balance: recWallet.balance + transfer.amount })
          .eq('user_id', recipientId);
      }

      await supabase.from('notifications').insert({
        user_id: recipientId,
        title: 'تم استلام حوالة',
        message: `تم إيداع $${transfer.amount.toFixed(2)} في محفظتك.`,
        type: 'success',
        read: false,
      });
    }

    // تحديث حالة التحويل
    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        metadata: { ...transfer.metadata, approved_by: decoded.role, reason },
      })
      .eq('id', id);

    // إشعار للمرسل
    await supabase.from('notifications').insert({
      user_id: transfer.user_id,
      title: 'تمت الموافقة على تحويلك',
      message: `تمت الموافقة على تحويلك بقيمة $${transfer.amount.toFixed(2)}.`,
      type: 'success',
      read: false,
    });

    // جلب بيانات المرسل
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', transfer.user_id)
      .single();

    // إشعار للإداريين
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['super_admin', 'staff']);

    if (admins && admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        user_id: admin.user_id,
        title: 'تم تأكيد تحويل',
        message: `تم تأكيد تحويل بقيمة $${transfer.amount.toFixed(2)} من ${senderProfile?.full_name || senderProfile?.email || 'غير معروف'}.`,
        type: 'admin',
        read: false,
        metadata: { action_url: '/dashboard?tab=deposits' },
      }));

      await supabase.from('notifications').insert(adminNotifications);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Transfer approve error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}