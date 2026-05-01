// src/app/api/wallet/transfer/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const { recipient, amount, note } = await req.json();
    if (!amount || amount <= 0) return NextResponse.json({ error: 'المبلغ غير صالح' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    let recipientId: string | null = null;

    // البحث بمرونة
    if (recipient.includes('@')) {
      const { data: user } = await supabase.from('profiles').select('id').ilike('email', recipient.trim()).single();
      recipientId = user?.id || null;
    } else if (recipient.length === 36 && recipient.includes('-')) {
      recipientId = recipient;
    } else {
      const clean = recipient.replace('MDC-', '').toLowerCase();
      const { data: user } = await supabase.from('profiles').select('id').eq('id', clean).single();
      if (!user) {
        const { data: userByEmail } = await supabase.from('profiles').select('id').ilike('email', recipient.trim()).single();
        recipientId = userByEmail?.id || null;
      } else {
        recipientId = user.id;
      }
    }

    if (!recipientId) return NextResponse.json({ error: 'المستلم غير موجود' }, { status: 400 });
    if (recipientId === decoded.id) return NextResponse.json({ error: 'لا يمكنك التحويل لنفسك' }, { status: 400 });

    const { data: sender } = await supabase.from('wallets').select('balance').eq('user_id', decoded.id).single();
    if (!sender || sender.balance < amount) return NextResponse.json({ error: 'رصيد غير كافٍ' }, { status: 400 });

    await supabase.from('wallets').update({ balance: sender.balance - amount }).eq('user_id', decoded.id);
    const { data: recWallet } = await supabase.from('wallets').select('balance').eq('user_id', recipientId).single();
    await supabase.from('wallets').update({ balance: (recWallet?.balance || 0) + amount }).eq('user_id', recipientId);

    await supabase.from('transactions').insert([
      { user_id: decoded.id, type: 'transfer', amount, status: 'completed', balance_before: sender.balance, balance_after: sender.balance - amount, metadata: { recipient_id: recipientId, recipient, note } },
      { user_id: recipientId, type: 'deposit', amount, status: 'completed', balance_before: recWallet?.balance || 0, balance_after: (recWallet?.balance || 0) + amount, metadata: { sender_id: decoded.id, note } },
    ]);

    await supabase.from('notifications').insert([
      { user_id: decoded.id, title: 'تم التحويل', message: `تم تحويل $${amount} إلى ${recipient}.`, type: 'success', read: false },
      { user_id: recipientId, title: 'تم استلام حوالة', message: `تم إيداع $${amount} في محفظتك.`, type: 'success', read: false },
    ]);

    // إشعار للإداريين
    const { data: senderProfile } = await supabase.from('profiles').select('email, full_name').eq('id', decoded.id).single();
    const { data: admins } = await supabase.from('user_roles').select('user_id').in('role', ['super_admin', 'staff']);
    if (admins) {
      const adminNotifications = admins.map(a => ({
        user_id: a.user_id,
        title: 'عملية تحويل',
        message: `تم تحويل $${amount} من ${senderProfile?.full_name || senderProfile?.email || 'مستخدم'} إلى ${recipient}.`,
        type: 'admin',
        read: false,
        metadata: { action_url: '/dashboard?tab=transfers' },
      }));
      await supabase.from('notifications').insert(adminNotifications);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}