'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Phone, MapPin, Heart, Mail, Headphones } from 'lucide-react';

const footerLinks = {
  'منتجاتنا': [
    { label: 'المنتجات الرقمية', href: '/products' },
  ],
  'المنصة': [
    { label: 'عن منصة MODC', href: '/legal/about' },
    { label: 'من نحن', href: '/legal/who-we-are' },
  ],
  'المساعدة': [
    { label: 'اتصل بنا', href: '#', action: 'call' },
    { label: 'الأسئلة الشائعة', href: '/legal/faq' },
    { label: 'سياسة الخصوصية', href: '/legal/privacy-policy' },
    { label: 'شروط الاستخدام', href: '/legal/terms-of-service' },
    { label: 'الدعم الفني (واتساب)', href: '#', action: 'whatsapp' },
  ],
};

export default function HomeFooter() {
  const [settings, setSettings] = useState({
    footer_description: 'منصة ModC – وجهتك الأولى للمنتجات الرقمية في سوريا والمنطقة العربية. محفظة رقمية، منتجات موثوقة، تسليم فوري.',
    footer_phone: '+963 933 068 923',
    footer_email_info: 'info@modc.store',
    footer_email_faq: 'faq@modc.store',
    footer_address: 'سوريا - مصياف',
    footer_copyright: '© 2026 ModC. جميع الحقوق محفوظة.',
    whatsapp_number: '963933068923',
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (res.ok) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      } catch {}
    }
    fetchSettings();
  }, []);

  const handleLinkClick = (link: any) => {
    if (link.action === 'call') {
      window.location.href = `tel:${settings.footer_phone}`;
    } else if (link.action === 'whatsapp') {
      const message = encodeURIComponent('مرحباً، أحتاج إلى مساعدة في منصة ModC');
      window.open(`https://wa.me/${settings.whatsapp_number}?text=${message}`, '_blank');
    }
  };

  return (
    <footer className="relative pt-20 pb-8" style={{ background: 'rgba(7,7,16,0.95)', borderTop: '1px solid rgba(108,58,255,0.15)' }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(108,58,255,0.5), rgba(0,212,255,0.5), transparent)' }} />
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 xl:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-12 mb-16">
          <div className="xl:col-span-2 text-right">
            <div className="flex items-center gap-3 justify-end mb-5">
              <AppLogo size={40} />
            </div>
            <p className="text-gray-400 leading-relaxed mb-6 max-w-xs mr-auto">
              {settings.footer_description}
            </p>

            <div className="space-y-3">
              <a href={`tel:${settings.footer_phone}`} className="flex items-center justify-end gap-3 group">
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors" dir="ltr">{settings.footer_phone}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110" style={{ background: 'rgba(108,58,255,0.15)', border: '1px solid rgba(108,58,255,0.3)' }}>
                  <Phone size={14} className="text-violet-400" />
                </div>
              </a>

              <a href={`mailto:${settings.footer_email_info}`} className="flex items-center justify-end gap-3 group">
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors" dir="ltr">{settings.footer_email_info}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110" style={{ background: 'rgba(108,58,255,0.15)', border: '1px solid rgba(108,58,255,0.3)' }}>
                  <Mail size={14} className="text-violet-400" />
                </div>
              </a>

              <a href={`mailto:${settings.footer_email_faq}`} className="flex items-center justify-end gap-3 group">
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors" dir="ltr">{settings.footer_email_faq}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110" style={{ background: 'rgba(108,58,255,0.15)', border: '1px solid rgba(108,58,255,0.3)' }}>
                  <Mail size={14} className="text-violet-400" />
                </div>
              </a>

              <div className="flex items-center justify-end gap-3">
                <span className="text-sm text-gray-300">{settings.footer_address}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }}>
                  <MapPin size={14} className="text-cyan-400" />
                </div>
              </div>
            </div>

            <a href={`tel:${settings.footer_phone}`} className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95" style={{ background: 'linear-gradient(135deg, #6C3AFF, #00D4FF)', boxShadow: '0 4px 20px rgba(108,58,255,0.4)' }}>
              <Phone size={16} />
              <span>اتصل مباشرة</span>
            </a>
          </div>

          {Object.entries(footerLinks)?.map(([section, links]) => (
            <div key={`footer-section-${section}`} className="text-right">
              <h4 className="font-bold text-white mb-4">{section}</h4>
              <ul className="space-y-3">
                {links?.map((link) => (
                  <li key={`footer-link-${link?.label}`}>
                    {link.action ? (
                      <button
                        onClick={() => handleLinkClick(link)}
                        className="text-sm text-gray-400 hover:text-violet-300 transition-colors duration-200"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link href={link?.href} className="text-sm text-gray-400 hover:text-violet-300 transition-colors duration-200">
                        {link?.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: '1px solid rgba(108,58,255,0.1)' }}>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>صُنع بـ</span>
            <Heart size={14} className="text-red-400 fill-red-400" />
            <span>في الجمهورية العربية السورية</span>
          </div>
          <p className="text-sm text-gray-500">{settings.footer_copyright}</p>
        </div>
      </div>
    </footer>
  );
}