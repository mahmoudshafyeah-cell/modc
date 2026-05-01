'use client';
import { useEffect, useState } from 'react';
import { ShoppingCart, DollarSign, User, Package } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  product_id: string;
  asset_data: any;
  purchase_price: number;
  sale_price: number | null;
  status: 'available' | 'sold';
  customer_email: string | null;
  created_at: string;
  products: {
    name: string;
    price: number;
  };
}

export default function AgentInventory({ userData }: { userData: any }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellModal, setSellModal] = useState<{ open: boolean; item: InventoryItem | null }>({
    open: false,
    item: null,
  });
  const [customerEmail, setCustomerEmail] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [selling, setSelling] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/inventory', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setInventory(data.inventory || []);
    } catch (error) {
      toast.error('فشل جلب المخزون');
    } finally {
      setLoading(false);
    }
  }

  async function handleSell() {
    if (!sellModal.item || !customerEmail || !sellingPrice) {
      toast.error('يرجى إدخال البريد الإلكتروني والسعر');
      return;
    }
    setSelling(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/agent/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inventoryId: sellModal.item.id,
          customerEmail,
          sellingPrice: parseFloat(sellingPrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل البيع');

      toast.success(`تم البيع بنجاح! الربح: $${data.profit?.toFixed(2) || '0.00'}`);
      setSellModal({ open: false, item: null });
      setCustomerEmail('');
      setSellingPrice('');
      fetchInventory();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSelling(false);
    }
  }

  if (loading) return <div className="p-6 text-gray-400">جاري تحميل المخزون...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-right">
        <h1 className="text-2xl font-black text-white">مخزني</h1>
        <p className="text-sm text-gray-400">المنتجات التي اشتريتها بالجملة وجاهزة للبيع</p>
      </div>

      {inventory.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">المخزون فارغ</h3>
          <p className="text-gray-400">قم بشراء منتجات الجملة أولاً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {inventory.filter(item => item.status === 'available').map(item => (
            <div
              key={item.id}
              className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'rgba(17,17,40,0.9)', border: '1px solid rgba(0,212,255,0.2)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-1 rounded-lg text-xs font-bold bg-green-600/20 text-green-400">
                  متاح للبيع
                </span>
                <Package size={20} className="text-cyan-400" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{item.products?.name || 'منتج'}</h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">سعر الشراء</span>
                  <span className="text-white font-bold">${item.purchase_price?.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSellModal({ open: true, item });
                  setSellingPrice('');
                  setCustomerEmail('');
                }}
                className="w-full py-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #FFB800, #FF6B00)',
                  boxShadow: '0 4px 15px rgba(255,184,0,0.3)',
                }}
              >
                <ShoppingCart size={16} />
                بيع للعميل
              </button>
            </div>
          ))}
        </div>
      )}

      {/* نافذة البيع */}
      {sellModal.open && sellModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setSellModal({ open: false, item: null })}>
          <div
            className="bg-dark-100 rounded-2xl p-6 w-full max-w-md border border-amber-500/30"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">بيع للعميل</h3>
            <p className="text-sm text-gray-400 mb-4">{sellModal.item.products?.name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2">بريد العميل</label>
                <div className="relative">
                  <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="input-field pr-10 text-right"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white mb-2">سعر البيع ($)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="number"
                    step="0.01"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    className="input-field pr-10 text-right"
                  />
                </div>
              </div>

              {sellingPrice && (
                <div className="rounded-xl p-3 text-right" style={{ background: 'rgba(0,255,148,0.08)', border: '1px solid rgba(0,255,148,0.2)' }}>
                  <p className="text-sm text-green-400">
                    الربح المتوقع: ${(parseFloat(sellingPrice) - (sellModal.item.purchase_price || 0)).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSell}
                  disabled={selling}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                >
                  {selling ? 'جاري البيع...' : 'تأكيد البيع'}
                </button>
                <button
                  onClick={() => setSellModal({ open: false, item: null })}
                  className="flex-1 py-3 rounded-xl font-bold bg-gray-700 text-white"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}