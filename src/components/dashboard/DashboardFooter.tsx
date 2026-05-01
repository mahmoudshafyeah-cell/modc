import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export default async function DashboardFooter() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data: versionData } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'platform_version')
    .single();
  const version = (versionData?.value as string) || '1.0.0';
  
  const { data: copyrightData } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'copyright_text')
    .single();
  const copyright = (copyrightData?.value as string) || 'Made with React by Mahmoud Shafyeh 2026';

  return (
    <footer className="border-t border-violet-500/20 py-3 px-6 text-center text-xs text-gray-500">
      <span>الإصدار {version}</span>
      <span className="mx-2">|</span>
      <span>{copyright}</span>
    </footer>
  );
}