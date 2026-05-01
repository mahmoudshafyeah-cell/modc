import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // تحديث auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

    // تحديث profiles
    await supabaseAdmin
      .from('profiles')
      .update({ email_confirmed_at: new Date() })
      .eq('id', userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}