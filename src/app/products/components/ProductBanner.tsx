'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function ProductBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    try {
      const token = localStorage.getItem('auth_token'); // ✅ نجلب التوكن
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`; // ✅ نرسله إذا وُجد

      const res = await fetch('/api/admin/banners?is_active=true', { headers });
      if (res.status === 401) {
        // المستخدم غير مسجل دخول، نتجاهل البانر
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (res.ok && data.banners?.length > 0) {
        setBanners(data.banners);
      }
    } catch (e) {
      console.error('فشل جلب البنرات:', e);
    } finally {
      setLoading(false);
    }
  }

  // التنقل التلقائي كل 5 ثوانٍ
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const goTo = (index: number) => {
    setCurrent((index + banners.length) % banners.length);
  };

  if (loading || banners.length === 0) return null;

  const banner = banners[current];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl mb-6" style={{ aspectRatio: '1920/1080', maxHeight: '400px' }}>
      <Link href={banner.link_url || '#'} className="block w-full h-full">
        <img
          src={banner.image_url}
          alt={banner.title || 'بانر'}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
      </Link>

      {banner.title && (
        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-4 py-2 rounded-lg text-sm">
          {banner.title}
        </div>
      )}

      {banners.length > 1 && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => goTo(current + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === current ? 'bg-white scale-125' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}