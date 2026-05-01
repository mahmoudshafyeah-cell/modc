// src/lib/authHelpers.ts
import { createClient } from '@supabase/supabase-js';

// دالة مساعدة لجلب الدور من جدول profiles مباشرة
export async function getUserRole(): Promise<string> {
  // 1. الحصول على التوكن من المخزن المحلي
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return 'customer';
  }

  // 2. إنشاء عميل Supabase مع التوكن لإجراء استعلام آمن
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  // 3. الحصول على المستخدم الحالي من الجلسة
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return 'customer';
  }

  // 4. استعلام مباشر إلى جدول `profiles` لجلب عمود 'role'
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error('فشل جلب دور المستخدم من قاعدة البيانات:', error);
    return 'customer'; // قيمة افتراضية آمنة في حال حدوث خطأ
  }

  // 5. إرجاع الدور الحقيقي من قاعدة البيانات
  return profile.role;
}