'use client';
import { createContext, useContext, ReactNode } from 'react';

interface WalletModalsContextType {
  openDeposit: () => void;
  openWithdraw: () => void;
}

const WalletModalsContext = createContext<WalletModalsContextType | undefined>(undefined);

export function WalletModalProvider({ children }: { children: ReactNode }) {
  // دوال فارغة لأن المدير لا يحتاج إلى إيداع/سحب من هذه الواجهة
  const openDeposit = () => {
    console.warn('Deposit modal is not available in admin dashboard');
  };
  const openWithdraw = () => {
    console.warn('Withdraw modal is not available in admin dashboard');
  };
  return (
    <WalletModalsContext.Provider value={{ openDeposit, openWithdraw }}>
      {children}
    </WalletModalsContext.Provider>
  );
}

export function useWalletModals() {
  const context = useContext(WalletModalsContext);
  if (!context) {
    throw new Error('useWalletModals must be used within WalletModalProvider');
  }
  return context;
}