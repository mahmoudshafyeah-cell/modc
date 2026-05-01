import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // السماح بالوصول إلى صفحة تسجيل الدخول بدون تحقق
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  // حماية جميع مسارات /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth_token')?.value || 
                  request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // هنا يمكن إضافة التحقق من صلاحية التوكن والدور (super_admin)
    // يمكنك استخدام supabase للتحقق من المستخدم
    
    // حالياً، نمرر الطلب إذا كان التوكن موجوداً
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};