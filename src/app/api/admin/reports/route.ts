import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'super_admin' && decoded.role !== 'staff')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // daily, weekly, custom
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const userId = searchParams.get('userId');

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    let query = supabase.from('transactions').select('*, profiles(full_name)');

    if (userId) query = query.eq('user_id', userId);

    if (startDate && endDate) {
      query = query.gte('created_at', startDate).lte('created_at', endDate);
    } else if (type === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('created_at', today);
    } else if (type === 'weekly') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', weekAgo);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ transactions: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}