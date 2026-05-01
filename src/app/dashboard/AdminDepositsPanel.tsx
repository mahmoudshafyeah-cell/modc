// src/app/dashboard/AdminDepositsPanel.tsx
'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Search, RefreshCw, X, MessageCircle, FileImage, Download, ExternalLink } from 'lucide-react';

interface FlexibleItem {
  id: string;
  user_email?: string;
  user_full_name?: string;
  from_user_email?: string;
  from_user_name?: string;
  amount?: number;
  method_name?: string;
  proof_url?: string | null;
  type?: string;
  deposit_number?: string;
  order_number?: string;
  account?: string;
  to_user?: string;
  note?: string;
  status?: string;
  created_at: string;
  itemType?: string;
  user_id?: string;
}

export default function AdminDepositsPanel() {
  const [items, setItems] = useState<FlexibleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('pending');
  const [search, setSearch] = useState('');
  const [p2pWhatsapp, setP2pWhatsapp] = useState('');
  const [modal, setModal] = useState<any>({ open: false });
  const [imageModal, setImageModal] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    const headers = { Authorization: `Bearer ${token}` };
    const endpoints = [
      { key: 'deposits', url: `/api/admin/deposits/pending?status=${activeFilter}` },
      { key: 'p2p', url: `/api/admin/p2p-deposits/pending?status=${activeFilter}` },
      { key: 'withdrawals', url: `/api/admin/withdrawals/pending?status=${activeFilter}` },
      { key: 'transfers', url: `/api/admin/transfers/pending?status=${activeFilter}` },
    ];

    const all: FlexibleItem[] = [];
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep.url, { headers });
        if (!res.ok) continue;
        const data = await res.json();
        const list = data[ep.key] || data['p2p'] || [];
        list.forEach((item: any) => {
          all.push({
            ...item,
            itemType:
              ep.key === 'p2p'
                ? 'p2p'
                : ep.key === 'withdrawals'
                ? 'withdrawal'
                : ep.key === 'transfers'
                ? 'transfer'
                : 'deposit',
            amount: Number(item.amount) || 0,
            status: item.status || 'pending',
          });
        });
      } catch {}
    }
    setItems(all);
    setLoading(false);
  };

  const fetchP2P = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      setP2pWhatsapp(data?.settings?.p2p_whatsapp || '');
    } catch {}
  };

  useEffect(() => {
    fetchAll();
    fetchP2P();
  }, [activeFilter]);

  const doAction = async () => {
    const { id, type, action } = modal;
    const token = localStorage.getItem('auth_token');
    const map: any = {
      deposit_approve: '/api/admin/deposits/approve',
      deposit_reject: '/api/admin/deposits/reject',
      withdrawal_approve: '/api/admin/withdrawals/approve',
      withdrawal_reject: '/api/admin/withdrawals/reject',
      transfer_approve: '/api/admin/transfers/approve',
      transfer_reject: '/api/admin/transfers/reject',
      p2p_approve: '/api/admin/p2p-deposits/approve',
      p2p_reject: '/api/admin/p2p-deposits/reject',
    };
    try {
      const res = await fetch(map[`${type}_${action}`], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, reason: modal.reason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(action === 'approve' ? 'تمت الموافقة' : 'تم الرفض');
      setModal({ open: false });

      // ✅ تحديث الحالة محلياً فوراً
      setItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, status: action === 'approve' ? 'completed' : 'rejected' } : item
        )
      );

      // إعادة تحميل البيانات في الخلفية
      fetchAll();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const get = (item: FlexibleItem, fields: string[], fallback: string = '—') => {
    for (const f of fields) if ((item as any)[f]) return (item as any)[f];
    return fallback;
  };

  const filtered = items.filter(item => {
    const matchTab =
      activeTab === 'all' ||
      item.itemType === activeTab ||
      (activeTab === 'deposits' && (item.itemType === 'deposit' || item.itemType === 'p2p'));
    const s = search.toLowerCase();
    return (
      matchTab &&
      (!s ||
        (item.user_email || '').toLowerCase().includes(s) ||
        (item.user_full_name || '').toLowerCase().includes(s) ||
        item.id.toLowerCase().includes(s))
    );
  });

  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (loading) return <div className="p-6 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">العمليات المالية</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث..."
              className="input-field pr-8 text-sm h-9 w-48"
            />
          </div>
          <button onClick={fetchAll} className="p-2 rounded-lg bg-violet-600/20 text-violet-400">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'deposits', 'p2p', 'withdrawals', 'transfers'].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              activeTab === t ? 'bg-violet-600 text-white' : 'bg-dark-100 text-gray-400'
            }`}
          >
            {t === 'all'
              ? 'الكل'
              : t === 'deposits'
              ? 'إيداعات'
              : t === 'p2p'
              ? 'إيداعات P2P'
              : t === 'withdrawals'
              ? 'سحوبات'
              : 'تحويلات'}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'completed', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setActiveFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeFilter === s ? 'bg-violet-600 text-white' : 'bg-dark-100 text-gray-400'
            }`}
          >
            {s === 'all'
              ? 'الكل'
              : s === 'pending'
              ? 'قيد الانتظار'
              : s === 'completed'
              ? 'مكتملة'
              : 'مرفوضة'}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-dark-100 border border-gray-700 overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-3 text-gray-400">النوع</th>
              <th className="p-3 text-gray-400">المستخدم</th>
              <th className="p-3 text-gray-400">البريد</th>
              <th className="p-3 text-gray-400">المبلغ</th>
              <th className="p-3 text-gray-400">الطريقة</th>
              <th className="p-3 text-gray-400">صورة</th>
              <th className="p-3 text-gray-400">التاريخ</th>
              <th className="p-3 text-gray-400">الحالة</th>
              <th className="p-3 text-gray-400">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const userName = get(item, ['user_full_name', 'from_user_name']);
              const userEmail = get(item, ['user_email', 'from_user_email']);
              const method = get(
                item,
                ['method_name'],
                item.itemType === 'transfer' ? 'تحويل داخلي' : '—'
              );
              const proof = item.proof_url || null;
              const typeLabels: any = {
                deposit: 'إيداع',
                p2p: 'إيداع P2P',
                withdrawal: 'سحب',
                transfer: 'تحويل',
              };
              const statusLabels: any = {
                pending: 'قيد الانتظار',
                completed: 'مكتمل',
                rejected: 'مرفوض',
              };

              return (
                <tr key={item.id} className="border-b border-gray-800 hover:bg-violet-500/5">
                  <td className="p-3">
                    <span
                      className={`text-xs font-bold ${
                        item.itemType === 'deposit'
                          ? 'text-green-400'
                          : item.itemType === 'p2p'
                          ? 'text-yellow-400'
                          : item.itemType === 'withdrawal'
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {typeLabels[item.itemType || 'deposit']}
                    </span>
                  </td>
                  <td className="p-3 text-white">{userName}</td>
                  <td className="p-3 text-gray-400" dir="ltr">
                    {userEmail}
                  </td>
                  <td className="p-3 text-white font-bold">${(item.amount || 0).toFixed(2)}</td>
                  <td className="p-3 text-gray-300">{method}</td>
                  <td className="p-3">
                    {proof ? (
                      <button
                        onClick={() => setImageModal(proof)}
                        className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 flex items-center gap-1"
                      >
                        <FileImage size={14} />
                        <span className="text-xs">عرض</span>
                      </button>
                    ) : (
                      <span className="text-gray-500 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-3 text-gray-400 text-xs">
                    {new Date(item.created_at).toLocaleString('ar-SY')}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.status === 'pending'
                          ? 'bg-yellow-600/20 text-yellow-400'
                          : item.status === 'completed'
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-red-600/20 text-red-400'
                      }`}
                    >
                      {statusLabels[item.status || 'pending']}
                    </span>
                  </td>
                  <td className="p-3">
                    {item.status === 'pending' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            setModal({
                              open: true,
                              id: item.id,
                              type: item.itemType === 'p2p' ? 'p2p' : item.itemType,
                              action: 'approve',
                              item,
                            })
                          }
                          className="p-1.5 rounded-lg bg-green-600/20 text-green-400"
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          onClick={() =>
                            setModal({
                              open: true,
                              id: item.id,
                              type: item.itemType === 'p2p' ? 'p2p' : item.itemType,
                              action: 'reject',
                              item,
                            })
                          }
                          className="p-1.5 rounded-lg bg-red-600/20 text-red-400"
                        >
                          <XCircle size={14} />
                        </button>
                        {item.itemType === 'p2p' && item.order_number && p2pWhatsapp && (
                          <button
                            onClick={() =>
                              window.open(
                                `https://wa.me/${p2pWhatsapp}?text=${encodeURIComponent(
                                  'رقم الطلب: ' + item.order_number
                                )}`,
                                '_blank'
                              )
                            }
                            className="p-1.5 rounded-lg bg-green-600/20 text-green-400"
                          >
                            <MessageCircle size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-400">لا توجد عمليات</div>
        )}
      </div>

      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setModal({ open: false })}
        >
          <div
            className="bg-dark-100 rounded-2xl p-6 w-full max-w-md border border-violet-500/30"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between mb-4">
              <button onClick={() => setModal({ open: false })} className="text-gray-400">
                <X size={20} />
              </button>
              <h3 className="text-lg font-bold text-white">
                {modal.action === 'approve' ? 'تأكيد الموافقة' : 'تأكيد الرفض'}
              </h3>
            </div>
            <div className="bg-dark-50 p-3 rounded-xl mb-4 text-sm text-gray-300">
              {modal.action === 'approve' ? 'سيتم الموافقة على' : 'سيتم رفض'} هذا الطلب بقيمة{' '}
              <span className="text-white font-bold">
                ${modal.item?.amount?.toFixed(2) || 0}
              </span>
            </div>
            <textarea
              value={modal.reason || ''}
              onChange={e => setModal({ ...modal, reason: e.target.value })}
              placeholder={modal.action === 'reject' ? 'سبب الرفض...' : 'ملاحظة...'}
              rows={3}
              className="w-full p-3 rounded-xl bg-dark-50 border border-gray-700 text-white text-sm"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={doAction}
                className={`flex-1 py-3 rounded-xl font-bold text-white ${
                  modal.action === 'approve' ? 'bg-green-600' : 'bg-red-600'
                }`}
              >
                تأكيد
              </button>
              <button
                onClick={() => setModal({ open: false })}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-white"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {imageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setImageModal(null)}
        >
          <div
            className="bg-dark-100 rounded-2xl p-4 max-w-lg w-full border border-gray-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between mb-3">
              <button onClick={() => setImageModal(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
              <h3 className="text-white font-bold">صورة الإثبات</h3>
            </div>
            <img
              src={imageModal}
              alt="صورة الإثبات"
              className="w-full rounded-xl max-h-96 object-contain mb-4"
            />
            <div className="flex gap-2">
              <a
                href={imageModal}
                download
                target="_blank"
                className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-center font-bold text-sm flex items-center justify-center gap-1"
              >
                <Download size={14} /> تنزيل
              </a>
              <button
                onClick={() => window.open(imageModal, '_blank')}
                className="flex-1 py-2 rounded-xl bg-cyan-600 text-white font-bold text-sm flex items-center justify-center gap-1"
              >
                <ExternalLink size={14} /> فتح
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}