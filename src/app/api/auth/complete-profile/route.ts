import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId, fullName, phone, role, isSubAgent, refId, promoCode } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId مطلوب' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabaseAdmin.from('profiles').upsert(
      { id: userId, full_name: fullName || 'مستخدم', phone: phone || null },
      { onConflict: 'id' }
    );
    await supabaseAdmin.from('user_roles').upsert(
      { user_id: userId, role: role || 'customer' },
      { onConflict: 'user_id' }
    );
    await supabaseAdmin.from('wallets').upsert(
      { user_id: userId, balance: 0, reserved_balance: 0 },
      { onConflict: 'user_id' }
    );

    if (role === 'agent') {
      const agentCode = `AGT-${userId.slice(0, 8).toUpperCase()}`;
      await supabaseAdmin.from('profiles').update({ agent_code: agentCode }).eq('id', userId);
    }

    let agentId = refId;
    // إذا لم يوجد refId ولكن يوجد promoCode، نبحث عن الوكيل بواسطة agent_code
    if (!agentId && promoCode) {
      const { data: agentProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('agent_code', promoCode)
        .single();
      if (agentProfile) {
        agentId = agentProfile.id;
      }
    }

    if (agentId) {
      const { error: subAgentError } = await supabaseAdmin.from('sub_agents').upsert(
        {
          agent_id: agentId,
          sub_agent_id: userId,
          promo_code: promoCode || null,
          status: 'active',
          joined_at: new Date().toISOString(),
        },
        { onConflict: 'sub_agent_id' }
      );

      if (!subAgentError) {
        const { data: subAgentProfile } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId)
          .single();

        // إرسال إشعار للوكيل الأساسي
        await supabaseAdmin.from('notifications').insert({
          user_id: agentId,
          title: '🎉 انضم إليك وكيل فرعي جديد!',
          message: `الوكيل الفرعي ${subAgentProfile?.full_name || subAgentProfile?.email || 'جديد'} انضم إلى وكالتك.`,
          type: 'success',
          read: false,
          metadata: { action_url: '/agent-dashboard?tab=clients' },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}