import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) throw new Error('غير مصرح');
  const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
  return decoded.id;
}

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance, reserved_balance')
      .eq('user_id', userId)
      .single();

    if (walletError) throw walletError;

    const { data: spentData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'purchase')
      .eq('status', 'completed');

    const total_spent = spentData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const wallet_id = `MDC-${userId.slice(0, 8).toUpperCase()}`;

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