import React from 'react';
import { Toaster } from 'sonner';
import ThemeProvider from '@/components/ThemeProvider';
import AuthBrandPanel from './components/AuthBrandPanel';
import AuthPanel from './components/AuthPanel';

export default function SignUpLoginPage() {
  return (
    <ThemeProvider>
      <Toaster position="bottom-center" richColors />
      <div className="min-h-screen grid lg:grid-cols-2" style={{ background: '#0A0A14' }}>
        {/* Left: Brand panel (hidden on mobile) */}
        <AuthBrandPanel />
        {/* Right: Form panel */}
        <AuthPanel />
      </div>
    </ThemeProvider>
  );
}