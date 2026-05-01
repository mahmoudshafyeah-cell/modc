// المسار: src/app/api/admin/deposits/approve/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string; id: string };
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { id, reason } = await req.json();
    if (!id) return NextResponse.json({ error: 'معرف الإيداع مطلوب' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: deposit } = await supabase.from('deposit_requests').select('*').eq('id', id).eq('status', 'pending').single();
    if (!deposit) return NextResponse.json({ error: 'طلب الإيداع غير موجود' }, { status: 404 });

    await supabase.from('deposit_requests').update({ status: 'completed', notes: reason || 'تمت الموافقة', updated_at: new Date().toISOString() }).eq('id', id);

    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', deposit.user_id).single();
    const newBalance = (wallet?.balance || 0) + deposit.amount;
    await supabase.from('wallets').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('user_id', deposit.user_id);

    // تسجيل المعاملة
    await supabase.from('transactions').insert({
      user_id: deposit.user_id, type: 'deposit', amount: deposit.amount,
      balance_before: wallet?.balance || 0, balance_after: newBalance, status: 'completed',
      reference_id: id, metadata: { deposit_request_id: id, approved_by: decoded.id, reason },
    });

    // ======================== 🆕 ترقية مستوى الوكيل تلقائياً ========================
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', deposit.user_id)
      .single();

    if (userRole?.role === 'agent') {
      const { data: levels } = await supabase
        .from('agent_vip_levels')
        .select('*')
        .order('min_deposit', { ascending: true });

      if (levels && levels.length > 0) {
        const { data: allDeposits } = await supabase
          .from('deposit_requests')
          .select('amount')
          .eq('user_id', deposit.user_id)
          .eq('status', 'completed');

        const totalDeposited = (allDeposits || []).reduce((sum, d) => sum + (d.amount || 0), 0) + deposit.amount;

        let newLevel: any = null;
        for (const level of levels) {
          if (totalDeposited >= level.min_deposit) {
            if (!level.max_deposit || totalDeposited <= level.max_deposit) {
              newLevel = level;
            }
          }
        }

        if (newLevel) {
          const { data: existingAssignment } = await supabase
            .from('agent_vip_assignments')
            .select('id, level_id')
            .eq('agent_id', deposit.user_id)
            .single();

          if (existingAssignment) {
            if (existingAssignment.level_id !== newLevel.id) {
              await supabase
                .from('agent_vip_assignments')
                .update({ level_id: newLevel.id, assigned_at: new Date().toISOString() })
                .eq('id', existingAssignment.id);

              await supabase.from('notifications').insert({
                user_id: deposit.user_id,
                title: '🎉 ترقية مستوى VIP!',
                message: `تهانينا! تمت ترقيتك إلى مستوى ${newLevel.name}. نسبة العمولة: ${newLevel.commission_rate}%، نسبة الخصم: ${newLevel.discount_rate}%`,
                type: 'success',
                read: false,
              });
            }
          } else {
            await supabase.from('agent_vip_assignments').insert({
              agent_id: deposit.user_id,
              level_id: newLevel.id,
            });

            await supabase.from('notifications').insert({
              user_id: deposit.user_id,
              title: '🎉 تم تعيين مستوى VIP!',
              message: `مرحباً! تم تعيينك في مستوى ${newLevel.name}. نسبة العمولة: ${newLevel.commission_rate}%، نسبة الخصم: ${newLevel.discount_rate}%`,
              type: 'success',
              read: false,
            });
          }
        }
      }
    }
    // ======================== نهاية كود الترقية ========================

    // إشعار للعميل
    await supabase.from('notifications').insert({
      user_id: deposit.user_id, title: 'تمت الموافقة على إيداعك', message: `تمت إضافة $${deposit.amount.toFixed(2)} إلى رصيدك بنجاح.`, type: 'success', read: false,
      metadata: { action_url: '/customer-dashboard/transactions', amount: deposit.amount },
    });

    // إشعار للإداريين
    const { data: userProfile } = await supabase.from('profiles').select('email, full_name').eq('id', deposit.user_id).single();
    const { data: admins } = await supabase.from('user_roles').select('user_id').in('role', ['super_admin', 'staff']);
    if (admins && admins.length > 0) {
      const adminNotifications = admins.map(a => ({
        user_id: a.user_id, title: 'تم تأكيد إيداع',
        message: `تم تأكيد إيداع بقيمة $${deposit.amount.toFixed(2)} للمستخدم ${userProfile?.full_name || userProfile?.email || 'غير معروف'}.`,
        type: 'admin', read: false,
        metadata: { action_url: '/dashboard?tab=deposits', deposit_id: id, user_email: userProfile?.email },
      }));
      await supabase.from('notifications').insert(adminNotifications);
    }

    return NextResponse.json({ success: true, new_balance: newBalance });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}