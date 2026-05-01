export const dynamic = 'force-dynamic';
import '@/styles/tailwind.css';
import ThemeProvider from '@/components/ThemeProvider';
import { Toaster } from 'sonner';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import type { Metadata } from 'next';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

async function getMaintenanceMode(): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single();
  return data?.value === true || data?.value === 'true';
}

async function getUserRole(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    return decoded.role;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: faviconData } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'site_favicon')
    .single();

  const { data: logoData } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'site_logo')
    .single();

  return {
    title: 'ModC – المنتجات الرقمية',
    description: 'منصة ModC لتجارة المنتجات الرقمية. محفظة، شراء، إيداع، سحب، تحويل.',
    icons: {
      icon: faviconData?.value || '/favicon.ico',
      apple: '/icon-192.png',
    },
    manifest: '/manifest.json',
    openGraph: {
      images: [logoData?.value || '/assets/images/app_logo.png'],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-invoke-path') || '';

  const isApiPath = pathname.startsWith('/api/');
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/homepage') ||
    pathname.startsWith('/sign-up-login-screen') ||
    pathname.startsWith('/legal') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/maintenance');
  const isDashboardPath = pathname.startsWith('/dashboard');

  if (!isApiPath && !isPublicPath && !isDashboardPath) {
    const maintenance = await getMaintenanceMode();
    if (maintenance) {
      const role = await getUserRole();
      if (role !== 'super_admin') {
        redirect('/maintenance');
      }
    }
  }

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0c71b2" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ModC" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(
                    (reg) => console.log('✅ SW registered', reg.scope),
                    (err) => console.log('❌ SW failed', err)
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body>
        
          <Toaster position="bottom-center" richColors />
          {children}
       
      </body>
    </html>
  );
}