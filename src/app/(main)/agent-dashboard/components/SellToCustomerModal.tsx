'use client';
import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface SellToCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SellToCustomerModal({ open, onClose, onSuccess }: SellToCustomerModalProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(false);

  useEffect(() => {
    if (open) fetchProducts();
  }, [open]);

  async function fetchProducts() {
    setFetchingProducts(true);
    try {
      const res = await fetch('/api/products?limit=50');
      const data = await res.json();
      if (res.ok) setProducts(data.products || []);
    } catch (error) {
      toast.error('فشل جلب المنتجات');
    } finally {
      setFetchingProducts(false);
    }
  }

  if (!open) return null;

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.categories?.name_ar || '').includes(search)
  );

  const selectedProduct = products.find(p => p.id === selected);

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !customerEmail) {
      toast.error('يرجى اختيار منتج وإدخال بريد العميل');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: selected,
          customerEmail,
          sellPrice: selectedProduct.price,
          profit: (selectedProduct.price * 0.2).toFixed(2),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`تم بيع ${selectedProduct?.name} للعميل ${customerEmail} بنجاح!`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden animate-slide-up" style={{ background: '#111128', border: '1px solid rgba(255,184,0,0.3)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,184,0,0.15)' }}>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"><X size={16} /></button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.15)', border: '1px solid rgba(255,184,0,0.3)' }}>
              <ShoppingCart size={20} className="text-amber-400" />
            </div>
            <div className="text-right">
              <h3 className="font-bold text-white">بيع للعملاء</h3>
              <p className="text-xs text-gray-400">اختر منتجاً وأرسله للعميل</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSell} className="p-6 space-y-4">
          <div className="relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input placeholder="ابحث عن منتج..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pr-9 text-right w-full" />
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto scrollbar-thin">
            {fetchingProducts ? (
              <p className="text-gray-400 text-center py-4">جاري تحميل المنتجات...</p>
            ) : filtered.length === 0 ? (
              <p className="text-gray-400 text-center py-4">لا توجد منتجات</p>
            ) : (
              filtered.map(p => (
                <button key={p.id} type="button" onClick={() => setSelected(p.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 text-right"
                  style={selected === p.id ? { background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.4)' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(0,255,148,0.15)', color: '#00FF94' }}>
                      ربح ${(p.price * 0.2).toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400">${p.price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.categories?.name_ar || ''}</p>
                    </div>
                    <span className="text-2xl">{p.image || '📦'}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2 text-right">بريد العميل</label>
            <input type="email" placeholder="customer@modc.sy" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="input-field text-right w-full" dir="ltr" />
          </div>

          {selectedProduct && (
            <div className="rounded-xl p-3 text-right" style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-amber-400">ربح متوقع: ${(selectedProduct.price * 0.2).toFixed(2)}</span>
                <span className="text-sm text-gray-300">{selectedProduct.name}</span>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #FFB800, #FF8C00)', color: '#0A0A14' }}>
            {loading ? <><Loader2 size={18} className="animate-spin" /><span>جاري البيع...</span></> : <><ShoppingCart size={18} /><span>تأكيد البيع</span></>}
          </button>
        </form>
      </div>
    </div>
  );
}