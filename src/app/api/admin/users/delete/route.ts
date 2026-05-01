// src/app/api/admin/users/delete/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export async function DELETE(req: Request) {
  return handleDelete(req)
}

export async function POST(req: Request) {
  return handleDelete(req)
}

async function handleDelete(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string }
    if (decoded.role !== 'super_admin') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    let userId: string | null = null
    if (req.method === 'POST' || req.method === 'DELETE') {
      const body = await req.json().catch(() => ({}))
      userId = body.id || body.userId
    }
    if (!userId) {
      const { searchParams } = new URL(req.url)
      userId = searchParams.get('id') || searchParams.get('userId')
    }
    if (!userId) return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // 1. حذف جميع السجلات المرتبطة بالمستخدم (بالترتيب الصحيح لتجنب قيود المفاتيح الخارجية)
    const tables = [
      'ticket_replies',
      'support_tickets',
      'notifications',
      'deposit_requests',
      'withdrawal_requests',
      'orders',
      'agent_transactions',
      'agent_inventory',
      'activity_logs',
      'transactions',
      'user_push_subscriptions',
      'staff_permissions',
      'user_roles',
      'wallets',
    ]

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('user_id', userId)
      // نتجاهل أخطاء "لا يوجد صف" أو "جدول غير موجود"
      if (error && error.code !== 'PGRST116') {
        console.warn(`لم يتم الحذف من ${table}:`, error.message)
      }
    }

    // 2. حذف الملف الشخصي
    await supabase.from('profiles').delete().eq('id', userId)

    // 3. حذف المستخدم من auth.users
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}