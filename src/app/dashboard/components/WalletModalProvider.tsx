// src/app/dashboard/components/WalletModalProvider.tsx
'use client';
import { createContext, useContext, ReactNode } from 'react';
import { toast } from 'sonner';

interface WalletModalsContextType {
  openDeposit: () => void;
  openWithdraw: () => void;
}

const WalletModalsContext = createContext<WalletModalsContextType | undefined>(undefined);

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const openDeposit = () => {
    // هنا يمكنك إضافة منطق فتح نافذة الإيداع
    toast.info('سيتم إضافة وظيفة الإيداع قريبًا');
  };
  
  const openWithdraw = () => {
    toast.info('سيتم إضافة وظيفة السحب قريبًا');
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