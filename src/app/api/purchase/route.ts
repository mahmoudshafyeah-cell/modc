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
    const { productId, couponCode } = await req.json();
    if (!productId) return NextResponse.json({ error: 'معرف المنتج مطلوب' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    if (productError || !product) return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });

    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', decoded.id)
      .single();
    if (walletError || !wallet) return NextResponse.json({ error: 'فشل جلب المحفظة' }, { status: 500 });

    let finalPrice = product.price;
    if (couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();
      if (coupon) {
        if (coupon.valid_from && new Date().toISOString() < coupon.valid_from)
          return NextResponse.json({ error: 'الكوبون غير مفعل بعد' }, { status: 400 });
        if (coupon.valid_until && new Date().toISOString() > coupon.valid_until)
          return NextResponse.json({ error: 'انتهت صلاحية الكوبون' }, { status: 400 });
        if (coupon.max_uses && coupon.used_count >= coupon.max_uses)
          return NextResponse.json({ error: 'تم استخدام الحد الأقصى للكوبون' }, { status: 400 });

        if (coupon.discount_type === 'percent')
          finalPrice = product.price - (product.price * coupon.discount_value / 100);
        else
          finalPrice = product.price - coupon.discount_value;
        finalPrice = Math.max(0, Math.round(finalPrice * 100) / 100);
        await supabaseAdmin.from('coupons').update({ used_count: (coupon.used_count || 0) + 1 }).eq('id', coupon.id);
      }
    }

    if (wallet.balance < finalPrice) return NextResponse.json({ error: 'رصيد غير كافٍ' }, { status: 400 });

    const { data: warehouseSetting } = await supabaseAdmin
      .from('platform_settings')
      .select('value')
      .eq('key', 'warehouse_url')
      .single();
    const warehouseUrl = warehouseSetting?.value;

    if (!warehouseUrl) {
      const orderId = crypto.randomUUID();
      await supabaseAdmin.from('orders').insert({
        id: orderId,
        user_id: decoded.id,
        product_id: productId,
        amount: finalPrice,
        status: 'pending_allocation',
        payment_method: 'رصيد المحفظة',
      });
      return NextResponse.json({ success: true, message: 'الطلب قيد المعالجة', orderId });
    }

    let asset = null;
    try {
      const allocRes = await fetch(`${warehouseUrl}/api/assets/allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': WAREHOUSE_API_SECRET,
        },
        body: JSON.stringify({ product_id: productId, user_id: decoded.id }),
      });
      if (allocRes.ok) asset = await allocRes.json();
    } catch (error) {
      console.error('فشل الاتصال بالمخزون:', error);
    }

    if (!asset) {
      const orderId = crypto.randomUUID();
      await supabaseAdmin.from('orders').insert({
        id: orderId,
        user_id: decoded.id,
        product_id: productId,
        amount: finalPrice,
        status: 'pending_allocation',
        payment_method: 'رصيد المحفظة',
      });
      return NextResponse.json({ success: true, message: 'الطلب قيد المعالجة', orderId });
    }

    const newBalance = wallet.balance - finalPrice;
    await supabaseAdmin.from('wallets').update({ balance: newBalance, updated_at: new Date() }).eq('user_id', decoded.id);

    const orderId = crypto.randomUUID();
    await supabaseAdmin.from('orders').insert({
      id: orderId,
      user_id: decoded.id,
      product_id: productId,
      amount: finalPrice,
      status: 'completed',
      code: asset.data?.code || asset.data?.card_number || JSON.stringify(asset.data),
      payment_method: 'رصيد المحفظة',
    });

    await supabaseAdmin.from('transactions').insert({
      user_id: decoded.id,
      type: 'purchase',
      amount: finalPrice,
      balance_before: wallet.balance,
      balance_after: newBalance,
      status: 'completed',
      reference_id: orderId,
      metadata: { product_id: productId, asset_id: asset.id },
    });

    return NextResponse.json({ success: true, balance: newBalance, code: asset.data?.code || asset.data?.card_number || null });
  } catch (error: any) {
    console.error('Purchase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}