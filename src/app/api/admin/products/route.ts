import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-api-key',
    },
  });
}

export async function GET(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ products: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const body = await req.json();
    const { name, price, description, image_url, category_id, is_active, is_variable_quantity, min_quantity, max_quantity, player_required, is_direct_provider, wholesale_price, wholesale_only } = body;

    if (!name || price === undefined || price === null) {
      return NextResponse.json({ error: 'اسم المنتج والسعر مطلوبان' }, { status: 400 });
    }

    if (category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', category_id)
        .single();
      if (categoryError || !category) {
        return NextResponse.json({ error: 'الفئة غير موجودة' }, { status: 404 });
      }
    }

    const productData = {
      name,
      price: Number(price),
      description: description || null,
      image_url: image_url || null,
      category_id: category_id || null,
      is_active: is_active !== undefined ? is_active : true,
      is_variable_quantity: is_variable_quantity || false,
      min_quantity: min_quantity || null,
      max_quantity: max_quantity || null,
      player_required: player_required || false,
      is_direct_provider: is_direct_provider || false,
      wholesale_price: wholesale_price || null,
      wholesale_only: wholesale_only || false,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase.from('products').select('id').eq('name', name).single();
    let product;

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('products').update(productData).eq('id', existing.id).select().single();
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
      product = updated;
    } else {
      const { data: created, error: insertError } = await supabase
        .from('products').insert({ ...productData, created_at: new Date().toISOString() }).select().single();
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
      product = created;
    }

    return NextResponse.json({ success: true, product });
  } catch (e: any) {
    console.error('POST /api/admin/products error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const body = await req.json();
    const { id, name, price, description, image_url, category_id, is_active, is_variable_quantity, min_quantity, max_quantity, player_required, is_direct_provider, wholesale_price, wholesale_only } = body;

    if (!id) return NextResponse.json({ error: 'معرف المنتج مطلوب' }, { status: 400 });

    const productData = {
      name,
      price: price ? Number(price) : undefined,
      description: description || null,
      image_url: image_url || null,
      category_id: category_id || null,
      is_active: is_active !== undefined ? is_active : undefined,
      is_variable_quantity: is_variable_quantity || false,
      min_quantity: min_quantity || null,
      max_quantity: max_quantity || null,
      player_required: player_required || false,
      is_direct_provider: is_direct_provider || false,
      wholesale_price: wholesale_price || null,
      wholesale_only: wholesale_only || false,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('products').update(productData).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const apiKey = req.headers.get('x-api-key');

    if (!token && !apiKey) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
      if (decoded.role !== 'super_admin' && decoded.role !== 'staff') {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
      }
    }

    let productId: string | null = null;
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(s => s);
    if (pathSegments.length === 4 && pathSegments[0] === 'api' && pathSegments[1] === 'admin' && pathSegments[2] === 'products') {
      productId = pathSegments[3];
    }
    if (!productId) productId = url.searchParams.get('id');
    if (!productId) {
      try { const body = await req.clone().json(); productId = body.id || body.productId || null; } catch {}
    }
    if (!productId) {
      return NextResponse.json({ error: 'معرف المنتج مطلوب' }, { status: 400 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}