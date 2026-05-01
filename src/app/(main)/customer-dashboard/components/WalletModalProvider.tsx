'use client';
import React, { createContext, useContext, useState } from 'react';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import TransferModal from './TransferModal';

interface WalletModalContextType {
  openDeposit: () => void;
  openWithdraw: () => void;
  openTransfer: () => void;
  refreshWallet: () => void;
}

const WalletModalContext = createContext<WalletModalContextType>({
  openDeposit: () => {},
  openWithdraw: () => {},
  openTransfer: () => {},
  refreshWallet: () => {},
});

export const useWalletModals = () => useContext(WalletModalContext);

export function WalletModalProvider({
  children,
  userId,
  currentBalance,
  onBalanceUpdate,
}: {
  children: React.ReactNode;
  userId: string;
  currentBalance: number;
  onBalanceUpdate?: () => void;
}) {
  const [depOpen, setDepOpen] = useState(false);
  const [withOpen, setWithOpen] = useState(false);
  const [transOpen, setTransOpen] = useState(false);

  const refreshWallet = () => {
    if (onBalanceUpdate) onBalanceUpdate();
  };

  return (
    <WalletModalContext.Provider
      value={{
        openDeposit: () => setDepOpen(true),
        openWithdraw: () => setWithOpen(true),
        openTransfer: () => setTransOpen(true),
        refreshWallet,
      }}
    >
      {children}
      <DepositModal
        open={depOpen}
        onClose={() => setDepOpen(false)}
        userId={userId}
        onSuccess={refreshWallet}
      />
      <WithdrawModal
        open={withOpen}
        onClose={() => setWithOpen(false)}
        userId={userId}
        currentBalance={currentBalance}
        onSuccess={refreshWallet}
      />
      <TransferModal
        open={transOpen}
        onClose={() => setTransOpen(false)}
        userId={userId}
        onSuccess={refreshWallet}
      />
    </WalletModalContext.Provider>
  );
}