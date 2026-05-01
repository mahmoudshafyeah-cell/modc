import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

export async function POST(req: Request) {
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
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { title, message, targetType, userIds, sendEmail } = await req.json();
    if (!title || !message) return NextResponse.json({ error: 'العنوان والرسالة مطلوبان' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    let recipientIds: string[] = [];
    if (targetType === 'all') {
      const { data: allUsers } = await supabase.from('profiles').select('id');
      recipientIds = (allUsers || []).map(u => u.id);
    } else if (targetType === 'selected' && userIds) {
      recipientIds = userIds;
    }

    if (recipientIds.length > 0) {
      const notifications = recipientIds.map(user_id => ({ user_id, title, message, type: 'admin' }));
      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json({ success: true, count: recipientIds.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}