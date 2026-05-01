import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

export async function PUT(req: Request) {
  try {
    // التحقق من التوكن
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { userId, newRole } = await req.json();
    if (!userId || !newRole) {
      return NextResponse.json({ error: 'بيانات غير كاملة' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // تحديث الدور
    const { error } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: userId, role: newRole });

    if (error) {
      console.error('Role update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}