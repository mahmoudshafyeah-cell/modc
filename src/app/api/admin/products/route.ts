import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // التحقق من صلاحية المدير (يمكن إضافة decode JWT)
    const body = await req.json();
    const { name, description, price, image_url } = body;
    
    // إدراج المنتج في قاعدة بيانات المنصة (وليس المستودع)
    const { data, error } = await supabase
      .from('platform_products') // أو جدول المنتجات الرئيسي في المنصة
      .insert({ name, description, price, image_url, created_at: new Date() })
      .select()
      .single();
      
    if (error) throw error;
    return NextResponse.json({ success: true, product: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}