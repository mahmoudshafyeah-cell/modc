import '@/styles/tailwind.css';
import ThemeProvider from '@/components/ThemeProvider';
import { Toaster } from 'sonner';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const metadata = {
  title: 'ModC',
  description: 'منصة المنتجات الرقمية',
};

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 🔧 الاستخدام الصحيح لـ headers()
  const headersList = await headers();
  const pathname = headersList.get('x-invoke-path') || '';

  const isApiPath = pathname.startsWith('/api/');
  const isPublicPath = pathname === '/' || pathname.startsWith('/homepage') || pathname.startsWith('/sign-up-login-screen') || pathname.startsWith('/legal') || pathname.startsWith('/auth') || pathname.startsWith('/maintenance');
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
      <body>
        <ThemeProvider>
          <Toaster position="bottom-center" richColors />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}