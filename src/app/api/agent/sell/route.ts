import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== 'agent' && decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح للوكلاء' }, { status: 403 });
    }

    const { inventoryId, customerEmail, sellingPrice } = await req.json();
    if (!inventoryId || !customerEmail || !sellingPrice) {
      return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 });
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: inv } = await supabaseAdmin.from('agent_inventory').select('*').eq('id', inventoryId).eq('agent_id', decoded.id).single();
    if (!inv || inv.status !== 'available') return NextResponse.json({ error: 'الأصل غير متاح' }, { status: 400 });

    await supabaseAdmin.from('agent_inventory').update({
      status: 'sold',
      sale_price: sellingPrice,
      customer_email: customerEmail,
    }).eq('id', inventoryId);

    const profit = sellingPrice - (inv.purchase_price || 0);
    if (profit > 0) {
      const { data: wallet } = await supabaseAdmin.from('wallets').select('balance').eq('user_id', decoded.id).single();
      if (wallet) {
        await supabaseAdmin.from('wallets').update({ balance: wallet.balance + profit }).eq('user_id', decoded.id);
      }
    }

    await supabaseAdmin.from('agent_transactions').insert({
      user_id: decoded.id,
      type: 'sell',
      desc: `بيع أصل`,
      customer: customerEmail,
      amount: sellingPrice,
      profit,
    });

    return NextResponse.json({ success: true, profit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}