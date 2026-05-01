import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabaseClient';

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('platform_settings').select('*').maybeSingle();
  if (error) {
    console.error(error);
    return NextResponse.json({ settings: { site_name: 'ModC', footer_copyright: '© 2025 ModC' } });
  }
  return NextResponse.json({ settings: data || {} });
}