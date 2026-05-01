// src/app/api/agent/upload-avatar/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'الملف مطلوب' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fileName = `avatars/${decoded.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { cacheControl: '3600', upsert: true, contentType: file.type });

    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

    // تحديث avatar_url في profiles
    await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', decoded.id);

    return NextResponse.json({ avatarUrl: urlData.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'فشل الرفع' }, { status: 500 });
  }
}