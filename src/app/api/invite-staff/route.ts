import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, fullName, permissions } = await req.json();
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false } }
  );

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: 'https://modc.store/auth/update-password',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const userId = data.user.id;
  await supabaseAdmin.from('user_roles').upsert({ user_id: userId, role: 'staff' });
  await supabaseAdmin.from('staff_permissions').upsert({ user_id: userId, permissions });

  return NextResponse.json({ success: true });
}