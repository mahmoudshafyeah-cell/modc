// src/app/api/admin/wallets/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { role: string; id: string }
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const { userId, amount } = await req.json()
    if (!userId || amount === undefined || amount === 0)
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', userId).single()
    const currentBalance = wallet?.balance || 0
    const newBalance = Math.max(0, currentBalance + amount)

    await supabase.from('wallets').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('user_id', userId)

    // تسجيل معاملة للمسؤول (الذي قام بالإضافة)
    await supabase.from('transactions').insert({
      user_id: decoded.id,
      type: amount > 0 ? 'admin_deposit' : 'admin_withdrawal',
      amount: Math.abs(amount),
      status: 'completed',
      balance_before: 0,
      balance_after: 0,
      metadata: {
        target_user_id: userId,
        reason: amount > 0 ? 'إضافة رصيد إداري' : 'استرداد رصيد إداري',
        admin_action: true,
      },
    })

    // تسجيل معاملة للمستخدم المستهدف
    await supabase.from('transactions').insert({
      user_id: userId,
      type: amount > 0 ? 'admin_deposit' : 'admin_withdrawal',
      amount: Math.abs(amount),
      balance_before: currentBalance,
      balance_after: newBalance,
      status: 'completed',
      metadata: {
        admin_user_id: decoded.id,
        reason: amount > 0 ? 'إضافة رصيد إداري' : 'استرداد رصيد إداري',
        admin_action: true,
      },
    })

    // إشعار للمستخدم المستهدف
    await supabase.from('notifications').insert({
      user_id: userId,
      title: amount > 0 ? 'تمت إضافة رصيد إلى حسابك' : 'تم خصم رصيد من حسابك',
      message: amount > 0
        ? `تمت إضافة $${amount.toFixed(2)} إلى رصيدك من قبل الإدارة.`
        : `تم خصم $${Math.abs(amount).toFixed(2)} من رصيدك من قبل الإدارة.`,
      type: amount > 0 ? 'success' : 'warning',
      read: false,
    })

    // إشعار للإداريين الآخرين
    const { data: admins } = await supabase.from('user_roles').select('user_id').in('role', ['super_admin', 'staff'])
    if (admins) {
      const adminNotifications = admins.map(a => ({
        user_id: a.user_id,
        title: amount > 0 ? 'إضافة رصيد إداري' : 'استرداد رصيد إداري',
        message: amount > 0
          ? `تمت إضافة $${amount.toFixed(2)} للمستخدم ${userId}`
          : `تم استرداد $${Math.abs(amount).toFixed(2)} من المستخدم ${userId}`,
        type: 'admin',
        read: false,
        metadata: { action_url: '/dashboard?tab=deposits' },
      }))
      await supabase.from('notifications').insert(adminNotifications)
    }

    return NextResponse.json({ success: true, balance: newBalance })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}