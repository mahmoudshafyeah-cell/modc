import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function WalletCard({ userId }: { userId: string }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance, reserved_balance')
    .eq('user_id', userId)
    .single();

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(108,58,255,0.1)',
        border: '1px solid rgba(108,58,255,0.2)',
      }}
    >
      <h3 className="text-sm text-gray-400 mb-2">رصيد المحفظة</h3>
      <p className="text-4xl font-black text-white tabular-nums">
        ${wallet?.balance.toFixed(2) ?? '0.00'}
      </p>
      {wallet?.reserved_balance ? (
        <p className="text-sm text-gray-400 mt-1">
          محجوز: ${wallet.reserved_balance.toFixed(2)}
        </p>
      ) : null}
    </div>
  );
}