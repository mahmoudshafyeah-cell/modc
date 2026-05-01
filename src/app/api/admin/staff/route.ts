import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

// التحقق من صلاحية Super Admin
async function verifyAuth(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) throw new Error('غير مصرح');
  const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
  if (decoded.role !== 'super_admin') throw new Error('غير مصرح');
  return decoded;
}

export async function GET(req: Request) {
  try {
    await verifyAuth(req);
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // جلب جميع الموظفين (دور 'staff' في user_roles)
    const { data: staffRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'staff');

    if (roleError) return NextResponse.json({ error: roleError.message }, { status: 500 });

    const staffUserIds = staffRoles.map(r => r.user_id);
    if (staffUserIds.length === 0) return NextResponse.json({ staff: [] });

    // جلب بيانات المستخدمين من auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

    const staffAuthUsers = authUsers.users.filter(u => staffUserIds.includes(u.id));

    // جلب الصلاحيات
    const { data: permissions, error: permError } = await supabaseAdmin
      .from('staff_permissions')
      .select('user_id, permissions')
      .in('user_id', staffUserIds);

    // جلب profiles
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .in('id', staffUserIds);

    const staff = staffAuthUsers.map(u => {
      const perm = permissions?.find(p => p.user_id === u.id);
      const profile = profiles?.find(p => p.id === u.id);
      return {
        user_id: u.id,
        email: u.email,
        full_name: profile?.full_name || u.user_metadata?.full_name,
        permissions: perm?.permissions || [],
      };
    });

    return NextResponse.json({ staff });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    await verifyAuth(req);
    const { full_name, email, password, permissions } = await req.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    const userId = authData.user.id;

    await supabaseAdmin.from('user_roles').upsert({ user_id: userId, role: 'staff' });
    await supabaseAdmin.from('staff_permissions').upsert({ user_id: userId, permissions });

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    await verifyAuth(req);
    const { userId, full_name, permissions } = await req.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (full_name) {
      await supabaseAdmin.from('profiles').update({ full_name }).eq('id', userId);
    }
    if (permissions) {
      await supabaseAdmin.from('staff_permissions').upsert({ user_id: userId, permissions });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
    await supabaseAdmin.from('staff_permissions').delete().eq('user_id', userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}