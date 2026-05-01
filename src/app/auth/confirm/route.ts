import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const meta = user.user_metadata || {};
        const requestedRole = meta.requested_role || 'customer';
        const fullName = meta.full_name || 'مستخدم';
        const phone = meta.phone || null;

        // إنشاء جميع السجلات المطلوبة
        await supabaseAdmin.from('profiles').upsert({ id: user.id, full_name: fullName, phone }, { onConflict: 'id' });
        await supabaseAdmin.from('user_roles').upsert({ user_id: user.id, role: requestedRole }, { onConflict: 'user_id' });
        await supabaseAdmin.from('wallets').upsert({ user_id: user.id, balance: 0, reserved_balance: 0 }, { onConflict: 'user_id' });

        // ربط وكيل فرعي
        if (meta.is_sub_agent && meta.ref_agent_id) {
          await supabaseAdmin.from('sub_agents').upsert({
            agent_id: meta.ref_agent_id,
            sub_agent_id: user.id,
            promo_code: meta.promo_code || null,
            status: 'active',
            joined_at: new Date().toISOString(),
          }, { onConflict: 'sub_agent_id' });
        }

        const { data: roleRow } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id).single();
        const role = roleRow?.role || 'customer';

        let redirectPath = '/customer-dashboard';
        if (role === 'agent') redirectPath = '/agent-dashboard';
        else if (role === 'super_admin' || role === 'staff') redirectPath = '/dashboard';

        return NextResponse.redirect(new URL(`/auth/confirmed?next=${redirectPath}`, request.url));
      }
    }
  }

  return NextResponse.redirect(new URL('/sign-up-login-screen', request.url));
}