'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ShoppingCart, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

export default function AgentPurchasePage() {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePurchase = async () => {
    if (!productId.trim()) {
      toast.error('يرجى إدخال معرف المنتج');
      return;
    }
    setLoading(true);
    try {
      // استدعاء دالة RPC أو تنفيذ شراء مباشر للوكيل
      const { data, error } = await supabase.rpc('agent_bulk_purchase', {
        p_product_id: productId,
        p_quantity: quantity,
        p_agent_email: (await supabase.auth.getUser()).data.user?.email,
      });
      if (error) throw error;
      toast.success(`تم شراء ${quantity} أصل بنجاح`);
      setMessage(`تم شراء ${quantity} منتج من ${productId}`);
    } catch (err: any) {
      toast.error(err.message || 'فشل الشراء');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white">شراء بالجملة (الوكيل)</h1>
        <div className="bg-dark-100 rounded-xl p-6 border border-gray-800 space-y-4">
          <div>
            <label className="block text-white mb-2">معرف المنتج</label>
            <input
              type="text"
              value={productId}
              onChange={e => setProductId(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
              placeholder="مثال: prod_123"
            />
          </div>
          <div>
            <label className="block text-white mb-2">الكمية</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
            />
          </div>
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full py-2 rounded-xl bg-cyan-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
            شراء
          </button>
          {message && <div className="text-green-400 text-sm text-center mt-2">{message}</div>}
        </div>
      </div>
    </AuthGuard>
  );
}