import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const imageType = formData.get('type') as string;

    if (!file || !imageType) return NextResponse.json({ error: 'الملف والنوع مطلوبان' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // إنشاء اسم ملف آمن بدون أحرف غير لاتينية
    const safeType = imageType.replace(/[^a-zA-Z0-9_]/g, '_');
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `kyc/${decoded.id}/${safeType}-${Date.now()}-${safeFileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('kyc')
      .upload(fileName, file, { cacheControl: '3600', upsert: true, contentType: file.type });

    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('kyc').getPublicUrl(fileName);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'فشل الرفع' }, { status: 500 });
  }
}