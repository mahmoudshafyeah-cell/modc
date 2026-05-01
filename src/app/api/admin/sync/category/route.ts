import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const WAREHOUSE_API_SECRET = process.env.WAREHOUSE_API_SECRET || 'default-secret';

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== WAREHOUSE_API_SECRET) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { id, ...categoryData } = body;

    if (!categoryData.name_ar) {
      return NextResponse.json({ error: 'اسم الفئة مطلوب' }, { status: 400 });
    }

    if (id) {
      const { error } = await supabase
        .from('categories')
        .update({ ...categoryData, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, action: 'updated', id });
    } else {
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...categoryData, created_at: new Date().toISOString() })
        .select('id')
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, action: 'created', id: data.id });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}