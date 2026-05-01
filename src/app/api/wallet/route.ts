import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const userId = req.url ? new URL(req.url).searchParams.get('userId') : null;
    
    // للتأكد من أن المستخدم يطلب محفظته فقط (اختياري)
    if (userId && userId !== decoded.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // 1. جلب المحفظة
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance, reserved_balance, user_id')
      .eq('user_id', decoded.id)
      .single();

    if (walletError) return NextResponse.json({ error: walletError.message }, { status: 500 });

    // 2. جلب إجمالي الإنفاق (من transactions)
    const { data: spentData, error: spentError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', decoded.id)
      .eq('type', 'purchase')
      .eq('status', 'completed');

    if (spentError) return NextResponse.json({ error: spentError.message }, { status: 500 });

    const total_spent = spentData?.reduce((sum, t) => sum + t.amount, 0) || 0;

    // 3. إنشاء معرف محفظة (اختياري: يمكنك تخزينه في جدول wallets أو إنشاؤه)
    const wallet_id = `MDC-${decoded.id.slice(0, 8).toUpperCase()}`;

    return NextResponse.json({
      balance: wallet.balance,
      reserved_balance: wallet.reserved_balance,
      total_spent,
      wallet_id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}