import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const WAREHOUSE_API_SECRET = process.env.WAREHOUSE_API_SECRET || 'default-secret';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== 'agent' && decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'غير مصرح للوكلاء' }, { status: 403 });
    }

    const { productId, quantity } = await req.json();
    if (!productId || !quantity) return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 });

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: product } = await supabaseAdmin.from('products').select('*').eq('id', productId).single();
    if (!product || !product.wholesale_price) return NextResponse.json({ error: 'المنتج غير متاح للجملة' }, { status: 400 });

    const totalCost = product.wholesale_price * quantity;

    const { data: wallet } = await supabaseAdmin.from('wallets').select('balance').eq('user_id', decoded.id).single();
    if (!wallet || wallet.balance < totalCost) return NextResponse.json({ error: 'رصيد غير كافٍ' }, { status: 400 });

    const { data: warehouseSetting } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'warehouse_url').single();
    const warehouseUrl = warehouseSetting?.value;

    if (!warehouseUrl) return NextResponse.json({ error: 'المخزون غير متصل حالياً' }, { status: 503 });

    const assets = [];
    for (let i = 0; i < quantity; i++) {
      const allocRes = await fetch(`${warehouseUrl}/api/assets/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': WAREHOUSE_API_SECRET },
        body: JSON.stringify({ product_id: productId, user_id: decoded.id }),
      });
      if (allocRes.ok) assets.push(await allocRes.json());
    }

    if (assets.length === 0) return NextResponse.json({ error: 'لا توجد أصول متاحة في المخزون' }, { status: 400 });

    const newBalance = wallet.balance - totalCost;
    await supabaseAdmin.from('wallets').update({ balance: newBalance }).eq('user_id', decoded.id);

    for (const asset of assets) {
      await supabaseAdmin.from('agent_inventory').insert({
        agent_id: decoded.id,
        product_id: productId,
        asset_data: asset,
        purchase_price: product.wholesale_price,
        status: 'available',
      });
    }

    return NextResponse.json({ success: true, assetsCount: assets.length, newBalance });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}