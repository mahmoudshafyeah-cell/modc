// src/app/api/products/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ✅ GET يعمل للجميع (عام)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    let query = supabase
      .from('products')
      .select('*, categories(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ products: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔒 POST/PUT/DELETE تبقى محمية للمدراء فقط
async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('غير مصرح');
  const token = authHeader.replace('Bearer ', '');
  const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
  if (!['super_admin', 'staff'].includes(decoded.role)) throw new Error('غير مصرح');
}

export async function POST(req: Request) {
  try {
    await verifyAdmin(req);
    const body = await req.json();
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data, error } = await supabase.from('products').insert({
      name: body.name,
      price: parseFloat(body.price) || 0,
      description: body.description || '',
      image_url: body.image_url || null,
      category_id: body.category_id || null,
      is_active: body.is_active !== false,
      stock: 0,
    }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ success: true, product: data });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: Request) {
  try {
    await verifyAdmin(req);
    const { id, ...body } = await req.json();
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const updateData: any = {};
    for (const key of ['name', 'price', 'description', 'image_url', 'category_id', 'is_active']) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }
    const { error } = await supabase.from('products').update(updateData).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    await verifyAdmin(req);
    const id = new URL(req.url).searchParams.get('id');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}