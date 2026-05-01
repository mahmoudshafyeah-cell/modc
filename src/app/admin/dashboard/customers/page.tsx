'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import AuthGuard from '@/components/AuthGuard';

interface Customer {
  id: string;
  email: string;
  full_name: string;
  total_spent: number;
  orders_count: number;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at');
    if (error) {
      toast.error('فشل جلب العملاء');
      setLoading(false);
      return;
    }

    const customersWithStats = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: orders } = await supabase
          .from('orders')
          .select('total')
          .eq('customer_email', profile.email);
        const total_spent = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
        const orders_count = orders?.length || 0;
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name || '',
          total_spent,
          orders_count,
          created_at: profile.created_at,
        };
      })
    );
    setCustomers(customersWithStats);
    setLoading(false);
  }

  const filtered = customers.filter(c =>
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      <div dir="rtl" className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">العملاء</h1>
          <button onClick={fetchCustomers} className="p-2 rounded-xl bg-gray-700 hover:bg-gray-600">
            <RefreshCw size={18} className="text-gray-300" />
          </button>
        </div>
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="بحث بالبريد أو الاسم..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-80 pr-9 py-2 rounded-xl bg-dark-100 border border-gray-700 text-white text-sm"
          />
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا يوجد عملاء</div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-dark-100 border border-gray-800">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-3 text-right">البريد</th>
                  <th className="p-3 text-right">الاسم</th>
                  <th className="p-3 text-right">إجمالي المشتريات</th>
                  <th className="p-3 text-right">عدد الطلبات</th>
                  <th className="p-3 text-right">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-gray-300">{c.email}</td>
                    <td className="p-3 text-gray-300">{c.full_name || '-'}</td>
                    <td className="p-3 text-gray-300">${c.total_spent.toFixed(2)}</td>
                    <td className="p-3 text-gray-300">{c.orders_count}</td>
                    <td className="p-3 text-gray-300">{new Date(c.created_at).toLocaleDateString('ar-SY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}