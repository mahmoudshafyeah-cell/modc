import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase.from('platform_settings').select('*').maybeSingle();
    if (error) throw error;
    return NextResponse.json({ settings: data || {} });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}