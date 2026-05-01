// src/app/api/admin/users/ban/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { role: string }
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const { userId, ban } = await req.json()
    if (!userId) return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // تحديث حالة الحظر
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_banned: ban === true })
      .eq('id', userId)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // إذا كان حظراً، اطرد المستخدم فوراً
    if (ban === true) {
      await supabase.auth.admin.signOut(userId)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}