'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Globe, DollarSign, ChevronDown } from 'lucide-react';
import { useApp } from './ThemeProvider';

const langLabels: Record<string, string> = { ar: 'العربية', en: 'English (قريباً)', ku: 'کوردی (قريباً)' };
const currencyLabels: Record<string, string> = { SYP: 'ل.س (قريباً)', USD: '$', EUR: '€ (قريباً)', TRY: '₺ (قريباً)' };

export default function GlobalControls({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, currency, setCurrency } = useApp();
  const [langOpen, setLangOpen] = useState(false);
  const [currOpen, setCurrOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const currRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) setLangOpen(false);
      if (currRef.current && !currRef.current.contains(event.target as Node)) setCurrOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Language */}
      <div className="relative" ref={langRef}>
        <button onClick={() => setLangOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: 'rgba(108,58,255,0.15)', border: '1px solid rgba(108,58,255,0.3)', color: '#B899FF' }}>
          <Globe size={14} />
          {!compact && <span>{langLabels[lang]?.replace(' (قريباً)', '')}</span>}
          <ChevronDown size={12} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
        </button>
        {langOpen && (
          <div className="absolute top-full mt-2 rounded-xl overflow-hidden z-50 min-w-[120px]"
            style={{ background: '#111128', border: '1px solid rgba(108,58,255,0.3)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
            {(['ar', 'en', 'ku'] as const).map(l => (
              <button key={`lang-${l}`} onClick={() => { if (l === 'ar') setLang(l); setLangOpen(false); }}
                disabled={l !== 'ar'}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${l !== 'ar' ? 'text-gray-500 cursor-not-allowed opacity-60' : lang === l ? 'text-violet-400 hover:bg-violet-500/10' : 'text-gray-300 hover:bg-violet-500/10'}`}>
                {langLabels[l]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Currency */}
      <div className="relative" ref={currRef}>
        <button onClick={() => setCurrOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}>
          <DollarSign size={14} />
          {!compact && <span>{currency}</span>}
          <ChevronDown size={12} className={`transition-transform ${currOpen ? 'rotate-180' : ''}`} />
        </button>
        {currOpen && (
          <div className="absolute top-full mt-2 rounded-xl overflow-hidden z-50 min-w-[100px]"
            style={{ background: '#111128', border: '1px solid rgba(0,212,255,0.25)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
            {(['SYP', 'USD', 'EUR', 'TRY'] as const).map(c => (
              <button key={`curr-${c}`} onClick={() => { if (c === 'USD') setCurrency(c); setCurrOpen(false); }}
                disabled={c !== 'USD'}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${c !== 'USD' ? 'text-gray-500 cursor-not-allowed opacity-60' : currency === c ? 'text-cyan-400 hover:bg-cyan-500/10' : 'text-gray-300 hover:bg-cyan-500/10'}`}>
                {currencyLabels[c]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}