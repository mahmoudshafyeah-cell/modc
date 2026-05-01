// المسار: src/app/(main)/customer-dashboard/components/TransactionsList.tsx
'use client';

import { useState, useEffect } from 'react';

export default function TransactionsList() {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch('/api/customer/transactions', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTransactions(data.transactions || []));
  }, []);

  return (
    <div>
      {transactions.map(tx => (
        <div key={tx.id} className="flex justify-between p-2 border-b">
          <span>{tx.type === 'deposit' ? 'إيداع' : tx.type}</span>
          <span>{tx.amount} $</span>
          <span>{new Date(tx.created_at).toLocaleString('ar')}</span>
          <span>{tx.status === 'completed' ? '✅ مكتمل' : tx.status}</span>
        </div>
      ))}
      {transactions.length === 0 && <p>لا توجد معاملات</p>}
    </div>
  );
}