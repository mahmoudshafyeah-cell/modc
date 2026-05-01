import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

// دالة مساعدة  نشاط
export async function logActivity(
  userId: string,
  userEmail: string,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: any
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabase.from('activity_logs').insert({
      user_id: userId,
      user_email: userEmail,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || {},
    });
  } catch (error) {
    console.error('فشل تسجيل النشاط:', error);
  }
}

// API لاستدعاء التسجيل من أي مكان
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const { action, entityType, entityId, details } = await req.json();

    await logActivity(decoded.id, decoded.email, action, entityType, entityId, details);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}