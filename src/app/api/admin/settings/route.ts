import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// استخدام متغيرات البيئة مع التحقق من وجودها
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// إعدادات افتراضية في حال عدم وجود الجدول
const defaultSettings = {
  site_name: 'ModC',
  site_logo: '',
  favicon: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  footer_copyright: '© 2025 ModC',
  whatsapp_number: '',
  telegram_link: '',
  facebook_link: '',
  twitter_link: '',
  instagram_link: '',
};

export async function GET() {
  try {
    // محاولة جلب الإعدادات من الجدول
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .maybeSingle(); // لا تعطي خطأ إذا كان الجدول فارغاً

    if (error) {
      console.error('Supabase error fetching settings:', error);
      // نرجع الإعدادات الافتراضية بدلاً من 500
      return NextResponse.json({ settings: defaultSettings });
    }

    if (!data) {
      // لا توجد بيانات في الجدول، نرجع الافتراضية
      return NextResponse.json({ settings: defaultSettings });
    }

    return NextResponse.json({ settings: data });
  } catch (err: any) {
    console.error('Unexpected error in /api/admin/settings:', err);
    // في حالة حدوث أي خطأ غير متوقع، نرجع الافتراضية
    return NextResponse.json({ settings: defaultSettings });
  }
}

// إذا أردت دعم POST لتحديث الإعدادات (اختياري)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ error: 'Missing settings data' }, { status: 400 });
    }

    // التحقق من وجود صف في الجدول
    const { data: existing, error: fetchError } = await supabase
      .from('platform_settings')
      .select('id')
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching settings for update:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existing) {
      // تحديث الصف الموجود
      const { error: updateError } = await supabase
        .from('platform_settings')
        .update(settings)
        .eq('id', existing.id);
      if (updateError) throw updateError;
    } else {
      // إدراج صف جديد
      const { error: insertError } = await supabase
        .from('platform_settings')
        .insert(settings);
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error updating settings:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}