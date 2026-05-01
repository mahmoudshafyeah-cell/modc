import React from 'react';
import ThemeProvider from '@/components/ThemeProvider';
import HomeNav from './components/HomeNav';
import HeroSection from './components/HeroSection';
import CategoriesSection from './components/CategoriesSection';
import FeaturedProducts from './components/FeaturedProducts';
import TopUpServices from './components/TopUpServices';
import PaymentMethods from './components/PaymentMethods';
import HomeFooter from './components/HomeFooter';

export default function HomePage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen" style={{ background: '#0A0A14' }}>
        <HomeNav />
        <main>
          <HeroSection />
          <CategoriesSection />
          <FeaturedProducts />
          <TopUpServices />
          <PaymentMethods />
        </main>
        <HomeFooter />
      </div>
    </ThemeProvider>
  );
}