// src/app/api/admin/settings/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabase.from('platform_settings').select('key, value');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const settings: any = {};
    (data || []).forEach((r: any) => { settings[r.key] = r.value; });
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { key, value } = await req.json();
    if (!key) return NextResponse.json({ error: 'مفتاح مطلوب' }, { status: 400 });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await supabase.from('platform_settings').upsert({ key, value }, { onConflict: 'key' });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}