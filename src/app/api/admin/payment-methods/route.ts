import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

// التحقق من الصلاحيات
async function verifyAuth(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) throw new Error('غير مصرح');
  const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
  if (decoded.role !== 'super_admin' && decoded.role !== 'staff') throw new Error('غير مصرح');
  return decoded;
}

// GET: عرض كل طرق الدفع
export async function GET(req: Request) {
  try {
    await verifyAuth(req);
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ methods: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

// POST: إضافة طريقة دفع جديدة
export async function POST(req: Request) {
  try {
    await verifyAuth(req);
    const body = await req.json();
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabaseAdmin.from('payment_methods').insert(body);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT: تعديل طريقة دفع
export async function PUT(req: Request) {
  try {
    await verifyAuth(req);
    const { id, ...body } = await req.json();
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabaseAdmin.from('payment_methods').update(body).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE: حذف طريقة دفع
export async function DELETE(req: Request) {
  try {
    await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'معرف مطلوب' }, { status: 400 });
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabaseAdmin.from('payment_methods').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}