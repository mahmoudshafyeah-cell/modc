'use client';
import React, { createContext, useContext, useRef } from 'react';
import { WalletCardRef } from './WalletCard';

interface WalletContextType {
  walletRef: React.RefObject<WalletCardRef | null>;
}

const WalletContext = createContext<WalletContextType>({
  walletRef: { current: null },
});

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const walletRef = useRef<WalletCardRef>(null);

  return (
    <WalletContext.Provider value={{ walletRef }}>
      {children}
    </WalletContext.Provider>
  );
}