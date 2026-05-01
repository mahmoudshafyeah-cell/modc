// المسار: src/app/api/agent/credit/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== 'agent' && decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('agent_credits')
      .select('*')
      .eq('agent_id', decoded.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // جلب رصيد المحفظة
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', decoded.id)
      .single();

    return NextResponse.json({
      credit: data || { credit_limit: 0, used_credit: 0, status: 'inactive' },
      walletBalance: wallet?.balance || 0,
      availableCredit: (data?.credit_limit || 0) - (data?.used_credit || 0),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}