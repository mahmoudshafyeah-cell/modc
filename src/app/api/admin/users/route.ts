// src/app/api/admin/users/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    } catch {
      return NextResponse.json({ error: 'توكن غير صالح' }, { status: 401 });
    }

    if (decoded.role !== 'super_admin' && decoded.role !== 'staff')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. جلب كل المستخدمين من auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

    const usersList = authUsers?.users || [];
    if (usersList.length === 0) return NextResponse.json({ users: [] });

    const userIds = usersList.map(u => u.id);

    // 2. جلب profiles
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, is_banned, created_at, last_sign_in_at, last_sign_in_ip, email_confirmed')
      .in('id', userIds);

    // 3. جلب user_roles
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    // 4. جلب الأرصدة من wallets
    const { data: wallets } = await supabaseAdmin
      .from('wallets')
      .select('user_id, balance')
      .in('user_id', userIds);

    const walletMap = new Map((wallets || []).map(w => [w.user_id, w.balance]));

    // 5. دمج البيانات
    const users = usersList.map(u => {
      const profile = profiles?.find(p => p.id === u.id);
      const roleRow = roles?.find(r => r.user_id === u.id);
      return {
        id: u.id,
        full_name: profile?.full_name || u.user_metadata?.full_name || null,
        email: u.email || '',
        phone: profile?.phone || null,
        role: roleRow?.role || 'customer',
        is_banned: profile?.is_banned || false,
        created_at: u.created_at,
        last_sign_in_at: profile?.last_sign_in_at || null,
        last_sign_in_ip: profile?.last_sign_in_ip || null,
        email_confirmed: profile?.email_confirmed || false,
        balance: walletMap.get(u.id) ?? 0, // ✅ الرصيد الحقيقي
      };
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}