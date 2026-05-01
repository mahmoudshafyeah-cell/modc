import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const formData = await req.formData();
    const amount = parseFloat(formData.get('amount') as string);
    const method_id = (formData.get('method_id') as string) || null;
    const reference = (formData.get('reference') as string) || null;
    const image = formData.get('image') as File | null;

    if (!amount || amount <= 0) return NextResponse.json({ error: 'المبلغ غير صالح' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // رفع الصورة إن وجدت
    let proof_url: string | null = null;
    if (image && image.size > 0) {
      const fileExt = image.name.split('.').pop() || 'jpg';
      const fileName = `deposits/${decoded.id}/${Date.now()}-${Math.random().toString(36).substring(2, 5)}.${fileExt}`;
      const fileBuffer = await image.arrayBuffer();
      const { error: uploadError } = await supabaseAdmin.storage
        .from('deposits')
        .upload(fileName, fileBuffer, {
          contentType: image.type,
          cacheControl: '3600',
          upsert: true,
        });
      if (uploadError)
        return NextResponse.json({ error: 'فشل رفع الصورة: ' + uploadError.message }, { status: 500 });
      const { data: urlData } = supabaseAdmin.storage.from('deposits').getPublicUrl(fileName);
      proof_url = urlData?.publicUrl || null;
    }

    // إنشاء طلب الإيداع
    const { data: depositInsert, error: insertError } = await supabaseAdmin
      .from('deposit_requests')
      .insert({
        user_id: decoded.id,
        payment_method_id: method_id,
        amount,
        reference,
        proof_url,
        status: 'pending',
        type: 'normal',
      })
      .select('id')
      .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    // تسجيل معاملة معلقة
    const refId = reference && isValidUUID(reference) ? reference : null;
    await supabaseAdmin.from('transactions').insert({
      user_id: decoded.id,
      type: 'deposit',
      amount,
      status: 'pending',
      reference_id: refId,
      balance_before: 0,
      balance_after: 0,
      metadata: { method_id, proof_url, raw_reference: reference },
    });

    // إشعار للعميل
    await supabaseAdmin.from('notifications').insert({
      user_id: decoded.id,
      title: 'طلب إيداع قيد المراجعة',
      message: `تم استلام طلب الإيداع بقيمة $${amount.toFixed(2)} وهو قيد المراجعة.`,
      type: 'warning',
      read: false,
    });

    // ✅ إشعار للإداريين
    const { data: depositorProfile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', decoded.id)
      .single();

    const { data: admins } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .in('role', ['super_admin', 'staff']);

    if (admins && admins.length > 0) {
      const adminNotifications = admins.map(a => ({
        user_id: a.user_id,
        title: 'طلب إيداع جديد',
        message: `طلب إيداع بقيمة $${amount.toFixed(2)} من ${depositorProfile?.full_name || depositorProfile?.email || 'مستخدم'} بحاجة للمراجعة.`,
        type: 'admin',
        read: false,
        metadata: {
          action_url: '/dashboard?tab=deposits',
          deposit_id: depositInsert?.id,
          user_email: depositorProfile?.email,
        },
      }));
      await supabaseAdmin.from('notifications').insert(adminNotifications);
    }

    // ✅ خصم العمولة للوكيل الرئيسي (إذا كان المستخدم وكيلاً فرعياً)
    const { data: subAgent } = await supabaseAdmin
      .from('sub_agents')
      .select('agent_id, commission_rate')
      .eq('sub_agent_id', decoded.id)
      .eq('status', 'active')
      .single();

    if (subAgent) {
      const commissionAmount = (amount * subAgent.commission_rate) / 100;

      const { data: mainWallet } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('user_id', subAgent.agent_id)
        .single();

      if (mainWallet) {
        await supabaseAdmin
          .from('wallets')
          .update({ balance: mainWallet.balance + commissionAmount })
          .eq('user_id', subAgent.agent_id);

        await supabaseAdmin.from('transactions').insert({
          user_id: subAgent.agent_id,
          type: 'commission',
          amount: commissionAmount,
          balance_before: mainWallet.balance,
          balance_after: mainWallet.balance + commissionAmount,
          status: 'completed',
          metadata: { from_sub_agent: decoded.id, deposit_amount: amount },
        });

        await supabaseAdmin.from('notifications').insert({
          user_id: subAgent.agent_id,
          title: '💰 عمولة إيداع وكيل فرعي',
          message: `تم إضافة $${commissionAmount.toFixed(2)} إلى رصيدك كعمولة من إيداع وكيلك الفرعي.`,
          type: 'success',
          read: false,
        });
      }
    }

    // ✅ تسديد المديونية تلقائياً (إذا كان المستخدم وكيلاً ولديه ديون)
    const { data: roleRow } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', decoded.id)
      .single();

    if (roleRow?.role === 'agent') {
      const { data: credit } = await supabaseAdmin
        .from('agent_credits')
        .select('used_credit')
        .eq('agent_id', decoded.id)
        .single();

      if (credit && credit.used_credit > 0) {
        const repaymentAmount = Math.min(credit.used_credit, amount);

        await supabaseAdmin.from('agent_credit_transactions').insert({
          agent_id: decoded.id,
          type: 'credit_repayment',
          amount: repaymentAmount,
          status: 'completed',
          reference: depositInsert?.id,
        });

        await supabaseAdmin
          .from('agent_credits')
          .update({ used_credit: credit.used_credit - repaymentAmount })
          .eq('agent_id', decoded.id);

        await supabaseAdmin.from('notifications').insert({
          user_id: decoded.id,
          title: 'تم تسديد جزء من المديونية',
          message: `تم خصم $${repaymentAmount.toFixed(2)} من إيداعك لتسديد الديون.`,
          type: 'info',
          read: false,
        });
      }
    }

    return NextResponse.json({ success: true, deposit_id: depositInsert?.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}