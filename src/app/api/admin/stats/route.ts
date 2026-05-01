import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function verifyAuth(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) throw new Error('غير مصرح');
  const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
  if (decoded.role !== 'super_admin' && decoded.role !== 'staff') throw new Error('غير مصرح');
  return decoded;
}

export async function GET(req: Request) {
  try {
    await verifyAuth(req);
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: pendingDeposits } = await supabase.from('deposit_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: activeProducts } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);
    const { data: revenueData } = await supabase.rpc('get_monthly_revenue');

    return NextResponse.json({
      totalUsers: usersCount || 0,
      monthlyRevenue: revenueData || 0,
      pendingDeposits: pendingDeposits || 0,
      activeProducts: activeProducts || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}