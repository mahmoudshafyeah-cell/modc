// src/components/ThemeProvider.tsx
'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Lang = 'ar' | 'en' | 'ku';
type Currency = 'SYP' | 'USD' | 'EUR' | 'TRY';

interface AppContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  dir: 'rtl' | 'ltr';
  canInstallPwa: boolean;
  installPwa: () => void;
}

const AppContext = createContext<AppContextType>({
  lang: 'ar',
  setLang: () => {},
  currency: 'USD',
  setCurrency: () => {},
  dir: 'rtl',
  canInstallPwa: false,
  installPwa: () => {},
});

export const useApp = () => useContext(AppContext);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  const dir: 'rtl' | 'ltr' = lang === 'en' ? 'ltr' : 'rtl';

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  }, [lang, dir]);

  const setLang = (l: Lang) => setLangState(l);
  const setCurrency = (c: Currency) => setCurrencyState(c);

  // PWA installation listener
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installPwa = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstallPwa(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  return (
    <AppContext.Provider value={{ lang, setLang, currency, setCurrency, dir, canInstallPwa, installPwa }}>
      <div className="dark" dir={dir}>
        {children}
      </div>
    </AppContext.Provider>
  );
}