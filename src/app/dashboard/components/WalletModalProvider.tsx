'use client';
import { createContext, useContext, ReactNode } from 'react';

interface WalletModalsContextType {
  openDeposit: () => void;
  openWithdraw: () => void;
}

const WalletModalsContext = createContext<WalletModalsContextType | undefined>(undefined);

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const openDeposit = () => {
    console.warn('Deposit modal not available in admin panel');
  };
  const openWithdraw = () => {
    console.warn('Withdraw modal not available in admin panel');
  };
  return (
    <WalletModalsContext.Provider value={{ openDeposit, openWithdraw }}>
      {children}
    </WalletModalsContext.Provider>
  );
}

export function useWalletModals() {
  const context = useContext(WalletModalsContext);
  if (!context) throw new Error('useWalletModals must be used within WalletModalProvider');
  return context;
}