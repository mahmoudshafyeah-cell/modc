'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShoppingCart, Loader2, Tag } from 'lucide-react';

interface BuyButtonProps {
  productId: string;
  price: number;
  stock: number;
  isVariableQuantity?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  isDirectProvider?: boolean;
  playerRequired?: boolean;   // ✅ أضفنا playerRequired
}

export default function BuyButton({
  productId,
  price,
  stock,
  isVariableQuantity,
  minQuantity,
  maxQuantity,
  isDirectProvider,
  playerRequired,
}: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [finalPrice, setFinalPrice] = useState(price);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [playerId, setPlayerId] = useState('');   // ✅ حالة معرف اللاعب
  const router = useRouter();

  const effectiveMin = minQuantity || 1;
  const effectiveMax = maxQuantity || 100;
  const effectiveStock = isDirectProvider ? 999 : stock;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('يرجى إدخال كود الكوبون');
      return;
    }
    setCheckingCoupon(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: couponCode.trim(), productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'كوبون غير صالح');

      setAppliedCoupon(data.coupon);
      let discounted = price;
      if (data.coupon.discount_type === 'percent') {
        discounted = price - (price * data.coupon.discount_value / 100);
      } else {
        discounted = price - data.coupon.discount_value;
      }
      setFinalPrice(Math.max(0, discounted));
      toast.success(`تم تطبيق الكوبون — الخصم: $${(price - discounted).toFixed(2)}`);
    } catch (error: any) {
      toast.error(error.message);
      setAppliedCoupon(null);
      setFinalPrice(price);
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleBuy = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast.error('يجب تسجيل الدخول أولاً');
      router.push('/sign-up-login-screen');
      return;
    }

    if (!isDirectProvider && effectiveStock <= 0) {
      toast.error('عذراً، المنتج غير متوفر حالياً');
      return;
    }

    // ✅ التحقق من إدخال playerId إذا كان مطلوباً
    if (playerRequired && !playerId.trim()) {
      toast.error('يرجى إدخال معرف اللاعب (Player ID)');
      return;
    }

    const totalPrice = finalPrice * quantity;

    setLoading(true);
    try {
      const body: any = { productId };
      if (appliedCoupon) body.couponCode = appliedCoupon.code;
      if (isVariableQuantity) body.quantity = quantity;
      if (playerRequired) body.playerId = playerId.trim();   // ✅ إضافة playerId

      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الشراء');

      toast.success('تم الشراء بنجاح!');
      if (data.code) {
        alert(`🎉 تم شراء المنتج بنجاح!\n\nالكود الخاص بك:\n${data.code}\n\nتم خصم $${totalPrice.toFixed(2)} من رصيدك.\n${playerRequired ? `معرف اللاعب: ${playerId}` : ''}`);
      }
      router.push('/customer-dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* حقل الكوبون */}
      <div className="bg-dark-50 rounded-xl p-4 border border-gray-700">
        <p className="text-sm text-gray-300 mb-3 flex items-center gap-2">
          <Tag size={16} className="text-violet-400" />
          هل لديك كود خصم؟
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="أدخل كود الكوبون"
            className="flex-1 p-2.5 rounded-lg bg-dark-100 border border-gray-600 text-white text-sm"
            disabled={!!appliedCoupon}
          />
          {!appliedCoupon ? (
            <button
              onClick={handleApplyCoupon}
              disabled={checkingCoupon || !couponCode.trim()}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-bold disabled:opacity-50"
            >
              {checkingCoupon ? <Loader2 size={16} className="animate-spin" /> : 'تطبيق'}
            </button>
          ) : (
            <button
              onClick={() => {
                setAppliedCoupon(null);
                setFinalPrice(price);
                setCouponCode('');
                toast.info('تم إلغاء الكوبون');
              }}
              className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 text-sm font-bold border border-red-500/30"
            >
              إلغاء
            </button>
          )}
        </div>
        {appliedCoupon && (
          <div className="mt-2 p-2 rounded-lg bg-green-600/10 border border-green-500/20">
            <p className="text-xs text-green-400">
              ✅ كود <strong>{appliedCoupon.code}</strong> ({appliedCoupon.discount_type === 'percent' ? `${appliedCoupon.discount_value}%` : `$${appliedCoupon.discount_value}`}) — السعر الأصلي: <span className="line-through">${price.toFixed(2)}</span> → ${finalPrice.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* الكمية المتغيرة */}
      {isVariableQuantity && (
        <div className="bg-dark-50 rounded-xl p-4 border border-gray-700">
          <label className="block text-sm text-gray-300 mb-2">الكمية</label>
          <input
            type="number"
            min={effectiveMin}
            max={effectiveMax}
            value={quantity}
            onChange={e => {
              const val = parseInt(e.target.value) || 1;
              setQuantity(Math.min(Math.max(val, effectiveMin), effectiveMax));
            }}
            className="w-full p-3 rounded-xl bg-dark-100 border border-gray-600 text-white text-center text-lg"
          />
          <p className="text-xs text-gray-500 mt-2 text-center">
            السعر الإجمالي: ${(finalPrice * quantity).toFixed(2)}
          </p>
        </div>
      )}

      {/* ✅ حقل معرف اللاعب (يظهر فقط إذا كان المنتج يتطلب ذلك) */}
      {playerRequired && (
        <div className="bg-dark-50 rounded-xl p-4 border border-gray-700">
          <label className="block text-sm text-gray-300 mb-2">معرف اللاعب (Player ID)</label>
          <input
            type="text"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder="أدخل معرف اللاعب"
            className="w-full p-3 rounded-xl bg-dark-100 border border-gray-600 text-white text-right"
            required
          />
          <p className="text-xs text-gray-500 mt-2 text-center">
            سيتم ربط المنتج بمعرف اللاعب هذا عند التسليم.
          </p>
        </div>
      )}

      {/* المخزون */}
      {!isDirectProvider && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          المخزون المتاح: {effectiveStock}
        </p>
      )}

      {/* زر الشراء */}
      <button
        onClick={handleBuy}
        disabled={loading || (!isDirectProvider && effectiveStock <= 0)}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
      >
        {loading ? (
          <><Loader2 size={20} className="animate-spin" /> جاري الشراء...</>
        ) : (
          <><ShoppingCart size={20} /> اشتر الآن - ${(finalPrice * quantity).toFixed(2)}
            {appliedCoupon && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-2">خصم!</span>}
          </>
        )}
      </button>
    </div>
  );
}